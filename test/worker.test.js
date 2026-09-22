import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';

const BASE = 'http://localhost';

// The pool does not isolate storage between tests in this version, so clear the tables explicitly.
beforeEach(async () => {
  await env.DB.batch([env.DB.prepare('DELETE FROM snapshot'), env.DB.prepare('DELETE FROM document')]);
});

function put(body, init) {
  return SELF.fetch(BASE + '/api/doc', Object.assign({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }, init || {}));
}

async function snapshotCount() {
  return env.DB.prepare('SELECT COUNT(*) AS n FROM snapshot').first('n');
}

describe('GET /api/doc', () => {
  it('returns 404 on an empty database', async () => {
    const res = await SELF.fetch(BASE + '/api/doc');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'empty' });
  });
});

describe('PUT /api/doc', () => {
  it('creates version 1 and one snapshot when baseVersion is null on an empty database', async () => {
    const res = await put({ baseVersion: null, data: { payments: {} } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(1);
    expect(typeof body.updatedAt).toBe('string');

    const get = await (await SELF.fetch(BASE + '/api/doc')).json();
    expect(get.version).toBe(1);
    expect(get.data).toEqual({ payments: {} });
    expect(get.updatedBy).toBe('test@example.com');
    expect(await snapshotCount()).toBe(1);
  });

  it('increments the version, records updated_by, and adds a snapshot on a matching base', async () => {
    await put({ baseVersion: null, data: { a: 1 } });
    const res = await put({ baseVersion: 1, data: { a: 2 } });
    expect(res.status).toBe(200);
    expect((await res.json()).version).toBe(2);
    const get = await (await SELF.fetch(BASE + '/api/doc')).json();
    expect(get.data).toEqual({ a: 2 });
    expect(get.updatedBy).toBe('test@example.com');
    expect(await snapshotCount()).toBe(2);
  });

  it('returns 409 with the current document on a stale base and inserts no snapshot', async () => {
    await put({ baseVersion: null, data: { a: 1 } });
    await put({ baseVersion: 1, data: { a: 2 } });
    const res = await put({ baseVersion: 1, data: { a: 3 } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('conflict');
    expect(body.version).toBe(2);
    expect(body.data).toEqual({ a: 2 });
    expect(await snapshotCount()).toBe(2);
  });

  it('returns 409 when baseVersion is null but a document exists', async () => {
    await put({ baseVersion: null, data: { a: 1 } });
    const res = await put({ baseVersion: null, data: { a: 9 } });
    expect(res.status).toBe(409);
    expect((await res.json()).data).toEqual({ a: 1 });
  });

  it('treats a non-null base on an empty database as the first version', async () => {
    const res = await put({ baseVersion: 7, data: { a: 1 } });
    expect(res.status).toBe(200);
    expect((await res.json()).version).toBe(1);
  });

  it('rejects non-object data with 400', async () => {
    expect((await put({ baseVersion: null, data: [1, 2] })).status).toBe(400);
    expect((await put({ baseVersion: null, data: 'x' })).status).toBe(400);
    expect((await put({ baseVersion: 'one', data: {} })).status).toBe(400);
    expect((await put('not json')).status).toBe(400);
  });

  it('rejects oversized bodies with 413', async () => {
    const big = 'x'.repeat(5 * 1024 * 1024 + 1);
    const res = await put({ baseVersion: null, data: { big } });
    expect(res.status).toBe(413);
  });

  it('prunes snapshots to the newest 100', async () => {
    const stmts = [];
    for (let i = 1; i <= 104; i++) {
      stmts.push(env.DB.prepare("INSERT INTO snapshot (version, data, updated_by, created_at) VALUES (?, '{}', 'old@x', ?)").bind(i, new Date().toISOString()));
    }
    await env.DB.batch(stmts);
    await put({ baseVersion: null, data: { a: 1 } });
    expect(await snapshotCount()).toBe(100);
    expect(await env.DB.prepare('SELECT MIN(version) AS v FROM snapshot').first('v')).toBe(1);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM snapshot WHERE version <= 5').first('n')).toBe(1);
  });
});

describe('snapshots', () => {
  it('lists newest first without the data payload', async () => {
    await put({ baseVersion: null, data: { a: 1 } });
    await put({ baseVersion: 1, data: { a: 2 } });
    const res = await SELF.fetch(BASE + '/api/snapshots');
    expect(res.status).toBe(200);
    const { snapshots } = await res.json();
    expect(snapshots.map((s) => s.version)).toEqual([2, 1]);
    expect(snapshots[0]).toMatchObject({ updatedBy: 'test@example.com' });
    expect(typeof snapshots[0].createdAt).toBe('string');
    expect(snapshots[0].bytes).toBe(JSON.stringify({ a: 2 }).length);
    expect(snapshots[0].data).toBeUndefined();
  });

  it('restore writes a new version equal to the snapshot and records a snapshot of it', async () => {
    await put({ baseVersion: null, data: { a: 1 } });
    await put({ baseVersion: 1, data: { a: 2 } });
    const { snapshots } = await (await SELF.fetch(BASE + '/api/snapshots')).json();
    const v1 = snapshots.find((s) => s.version === 1);
    const res = await SELF.fetch(BASE + '/api/snapshots/' + v1.id + '/restore', { method: 'POST' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(3);
    expect(body.data).toEqual({ a: 1 });
    const get = await (await SELF.fetch(BASE + '/api/doc')).json();
    expect(get.version).toBe(3);
    expect(get.data).toEqual({ a: 1 });
    expect(await snapshotCount()).toBe(3);
  });

  it('restore returns 404 for an unknown snapshot id', async () => {
    const res = await SELF.fetch(BASE + '/api/snapshots/999/restore', { method: 'POST' });
    expect(res.status).toBe(404);
  });
});

describe('routing and identity', () => {
  it('returns 404 for unknown api paths', async () => {
    const res = await SELF.fetch(BASE + '/api/nothing');
    expect(res.status).toBe(404);
  });

  it('serves the static app for non-api paths', async () => {
    const res = await SELF.fetch(BASE + '/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
