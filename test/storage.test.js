import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const CACHE_KEY = 'household-expenses-v1';
const META_KEY = 'household-expenses-v1.meta';

function ok(body, status) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
}
function setCache(data, meta) {
  if (data !== undefined) localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  if (meta !== undefined) localStorage.setItem(META_KEY, JSON.stringify(meta));
}
function cache() { return JSON.parse(localStorage.getItem(CACHE_KEY)); }
function meta() { return JSON.parse(localStorage.getItem(META_KEY)); }
function putCalls() { return fetchMock.mock.calls.filter(([, init]) => init && init.method === 'PUT'); }
function putBody(call) { return JSON.parse(call[1].body); }

let fetchMock;
let CloudStore;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// The script reads the cache and meta keys when it loads, exactly as in a real page,
// so every test seeds localStorage first and then loads the script.
async function load() {
  vi.resetModules();
  await import('../public/storage.js');
  CloudStore = window.CloudStore;
}

describe('save', () => {
  it('writes the cache immediately and sends one PUT with the latest data after the debounce', async () => {
    await load();
    fetchMock.mockResolvedValue(ok({ version: 1, updatedAt: 't1' }));
    CloudStore.save({ a: 1 });
    CloudStore.save({ a: 2 });
    expect(cache()).toEqual({ a: 2 });
    expect(meta().dirty).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(putCalls()).toHaveLength(1);
    expect(putCalls()[0][0]).toBe('/api/doc');
    expect(putBody(putCalls()[0])).toEqual({ baseVersion: null, data: { a: 2 } });
    expect(putCalls()[0][1]).toMatchObject({ credentials: 'same-origin', redirect: 'manual' });
    expect(meta()).toEqual({ version: 1, dirty: false, savedAt: 't1' });
    expect(CloudStore.status()).toBe('saved');
  });

  it('runs one more PUT with the latest data when a save happens during an in-flight PUT', async () => {
    await load();
    let resolveFirst;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    fetchMock.mockResolvedValueOnce(ok({ version: 2, updatedAt: 't2' }));
    CloudStore.save({ a: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(1);

    CloudStore.save({ a: 2 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(1);

    resolveFirst(ok({ version: 1, updatedAt: 't1' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(putCalls()).toHaveLength(2);
    expect(putBody(putCalls()[1])).toEqual({ baseVersion: 1, data: { a: 2 } });
    await vi.advanceTimersByTimeAsync(0);
    expect(meta()).toEqual({ version: 2, dirty: false, savedAt: 't2' });
  });

  it('keeps dirty when a save arrives during an in-flight PUT that completes before the debounce fires', async () => {
    await load();
    let resolveFirst;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    fetchMock.mockResolvedValueOnce(ok({ version: 2, updatedAt: 't2' }));
    CloudStore.save({ a: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(1);

    CloudStore.save({ a: 2 });
    resolveFirst(ok({ version: 1, updatedAt: 't1' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(meta()).toEqual({ version: 1, dirty: true, savedAt: 't1' });
    expect(putCalls()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(2);
    expect(putBody(putCalls()[1])).toEqual({ baseVersion: 1, data: { a: 2 } });
    expect(meta()).toEqual({ version: 2, dirty: false, savedAt: 't2' });
  });
});

describe('start', () => {
  it('replaces the cache and fires onReplace when the remote is newer', async () => {
    setCache({ a: 1 }, { version: 1, dirty: false, savedAt: null });
    await load();
    fetchMock.mockResolvedValue(ok({ version: 3, data: { a: 3 }, updatedAt: 't3', updatedBy: 'mom@x' }));
    const replaced = vi.fn();
    CloudStore.onReplace(replaced);
    await CloudStore.start({ a: 1 });
    expect(replaced).toHaveBeenCalledWith({ a: 3 }, 'refresh');
    expect(cache()).toEqual({ a: 3 });
    expect(meta()).toEqual({ version: 3, dirty: false, savedAt: 't3' });
    expect(CloudStore.status()).toBe('saved');
  });

  it('adopts the remote on a fresh device with no cache', async () => {
    await load();
    fetchMock.mockResolvedValue(ok({ version: 2, data: { a: 2 }, updatedAt: 't2', updatedBy: 'mom@x' }));
    const replaced = vi.fn();
    CloudStore.onReplace(replaced);
    await CloudStore.start({ seed: true });
    expect(replaced).toHaveBeenCalledWith({ a: 2 }, 'refresh');
    expect(cache()).toEqual({ a: 2 });
    expect(putCalls()).toHaveLength(0);
  });

  it('keeps the cache when the remote is older or equal', async () => {
    setCache({ a: 3 }, { version: 3, dirty: false, savedAt: 't3' });
    await load();
    fetchMock.mockResolvedValue(ok({ version: 3, data: { a: 0 }, updatedAt: 't3', updatedBy: 'mom@x' }));
    const replaced = vi.fn();
    CloudStore.onReplace(replaced);
    await CloudStore.start({ a: 3 });
    expect(replaced).not.toHaveBeenCalled();
    expect(cache()).toEqual({ a: 3 });
    expect(CloudStore.status()).toBe('saved');
  });

  it('sends a PUT with the known base version when the cache is dirty', async () => {
    setCache({ a: 9 }, { version: 2, dirty: true, savedAt: 't2' });
    await load();
    fetchMock
      .mockResolvedValueOnce(ok({ version: 2, data: { a: 2 }, updatedAt: 't2', updatedBy: 'mom@x' }))
      .mockResolvedValueOnce(ok({ version: 3, updatedAt: 't3' }));
    await CloudStore.start({ a: 9 });
    expect(putCalls()).toHaveLength(1);
    expect(putBody(putCalls()[0])).toEqual({ baseVersion: 2, data: { a: 9 } });
    expect(meta()).toEqual({ version: 3, dirty: false, savedAt: 't3' });
  });

  it('uploads the local data as version 1 when the remote is empty', async () => {
    await load();
    fetchMock
      .mockResolvedValueOnce(ok({ error: 'empty' }, 404))
      .mockResolvedValueOnce(ok({ version: 1, updatedAt: 't1' }));
    await CloudStore.start({ seed: true });
    expect(putCalls()).toHaveLength(1);
    expect(putBody(putCalls()[0])).toEqual({ baseVersion: null, data: { seed: true } });
    expect(cache()).toEqual({ seed: true });
    expect(meta()).toEqual({ version: 1, dirty: false, savedAt: 't1' });
  });

  it('reports offline when the load fails and nothing is dirty', async () => {
    setCache({ a: 1 }, { version: 1, dirty: false, savedAt: 't1' });
    await load();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const statuses = [];
    CloudStore.onStatus((s) => statuses.push(s));
    await CloudStore.start({ a: 1 });
    expect(statuses).toEqual(['offline']);
    expect(cache()).toEqual({ a: 1 });
  });
});

describe('conflicts and failures', () => {
  it('replaces the cache, clears dirty, and fires onReplace with conflict on a 409', async () => {
    setCache({ a: 1 }, { version: 1, dirty: false, savedAt: 't1' });
    await load();
    fetchMock.mockResolvedValue(ok({ error: 'conflict', version: 5, data: { a: 5 }, updatedAt: 't5', updatedBy: 'mom@x' }, 409));
    const replaced = vi.fn();
    CloudStore.onReplace(replaced);
    CloudStore.save({ a: 2 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putBody(putCalls()[0])).toEqual({ baseVersion: 1, data: { a: 2 } });
    expect(replaced).toHaveBeenCalledWith({ a: 5 }, 'conflict');
    expect(cache()).toEqual({ a: 5 });
    expect(meta()).toEqual({ version: 5, dirty: false, savedAt: 't5' });
    expect(CloudStore.status()).toBe('saved');
  });

  it('keeps dirty and reports unsaved on a network failure, then retries on refresh', async () => {
    await load();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const statuses = [];
    CloudStore.onStatus((s) => statuses.push(s));
    CloudStore.save({ a: 2 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses).toEqual(['unsaved']);
    expect(meta().dirty).toBe(true);

    fetchMock.mockResolvedValueOnce(ok({ version: 1, updatedAt: 't1' }));
    await CloudStore.refresh();
    expect(putCalls()).toHaveLength(2);
    expect(meta()).toEqual({ version: 1, dirty: false, savedAt: 't1' });
    expect(statuses).toEqual(['unsaved', 'saved']);
  });

  it('reports disconnected on an opaque redirect or a 401', async () => {
    await load();
    fetchMock.mockResolvedValueOnce({ type: 'opaqueredirect', status: 0, ok: false });
    CloudStore.save({ a: 2 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(CloudStore.status()).toBe('disconnected');
    expect(meta().dirty).toBe(true);

    fetchMock.mockResolvedValueOnce(ok({ error: 'unauthenticated' }, 401));
    await CloudStore.refresh();
    expect(CloudStore.status()).toBe('disconnected');
  });

  it('a 409 cancels the debounce timer of an edit made during the conflicting PUT', async () => {
    setCache({ a: 1 }, { version: 1, dirty: false, savedAt: 't1' });
    await load();
    let resolveFirst;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    CloudStore.save({ a: 2 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(1);

    CloudStore.save({ a: 3 });
    resolveFirst(ok({ error: 'conflict', version: 5, data: { a: 5 }, updatedAt: 't5', updatedBy: 'mom@x' }, 409));
    await vi.advanceTimersByTimeAsync(0);
    expect(cache()).toEqual({ a: 5 });
    expect(meta()).toEqual({ version: 5, dirty: false, savedAt: 't5' });

    await vi.advanceTimersByTimeAsync(2000);
    expect(putCalls()).toHaveLength(1);
  });
});

describe('flush and refresh', () => {
  it('flush sends the pending save immediately with keepalive', async () => {
    await load();
    fetchMock.mockResolvedValue(ok({ version: 1, updatedAt: 't1' }));
    CloudStore.save({ a: 1 });
    const p = CloudStore.flush();
    expect(putCalls()).toHaveLength(1);
    expect(putCalls()[0][1].keepalive).toBe(true);
    await p;
    await vi.advanceTimersByTimeAsync(2000);
    expect(putCalls()).toHaveLength(1);
    expect(meta().dirty).toBe(false);
  });

  it('flush does nothing when nothing is dirty', async () => {
    setCache({ a: 1 }, { version: 1, dirty: false, savedAt: 't1' });
    await load();
    await CloudStore.flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refresh adopts a newer remote when the cache is clean', async () => {
    setCache({ a: 1 }, { version: 1, dirty: false, savedAt: 't1' });
    await load();
    fetchMock.mockResolvedValue(ok({ version: 2, data: { a: 2 }, updatedAt: 't2', updatedBy: 'mom@x' }));
    const replaced = vi.fn();
    CloudStore.onReplace(replaced);
    await CloudStore.refresh();
    expect(replaced).toHaveBeenCalledWith({ a: 2 }, 'refresh');
    expect(meta().version).toBe(2);
  });

  it('flush during an in-flight PUT sends the follow-up with keepalive as soon as the first completes', async () => {
    await load();
    let resolveFirst;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    fetchMock.mockResolvedValueOnce(ok({ version: 2, updatedAt: 't2' }));
    CloudStore.save({ a: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(1);

    CloudStore.save({ a: 2 });
    let flushed = false;
    const p = CloudStore.flush().then(() => { flushed = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(putCalls()).toHaveLength(1);
    expect(flushed).toBe(false);

    resolveFirst(ok({ version: 1, updatedAt: 't1' }));
    await p;
    expect(putCalls()).toHaveLength(2);
    expect(putBody(putCalls()[1])).toEqual({ baseVersion: 1, data: { a: 2 } });
    expect(putCalls()[1][1].keepalive).toBe(true);
    expect(meta()).toEqual({ version: 2, dirty: false, savedAt: 't2' });
    expect(CloudStore.status()).toBe('saved');
  });

  it('a save landing while flush waits on an in-flight PUT is sent once with keepalive and no third PUT follows', async () => {
    await load();
    let resolveFirst;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    fetchMock.mockResolvedValueOnce(ok({ version: 2, updatedAt: 't2' }));
    CloudStore.save({ a: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(putCalls()).toHaveLength(1);

    const p = CloudStore.flush();
    CloudStore.save({ a: 2 });
    resolveFirst(ok({ version: 1, updatedAt: 't1' }));
    await p;
    expect(putCalls()).toHaveLength(2);
    expect(putBody(putCalls()[1])).toEqual({ baseVersion: 1, data: { a: 2 } });
    expect(putCalls()[1][1].keepalive).toBe(true);
    expect(meta()).toEqual({ version: 2, dirty: false, savedAt: 't2' });

    await vi.advanceTimersByTimeAsync(2000);
    expect(putCalls()).toHaveLength(2);
  });
});

describe('snapshots', () => {
  it('lists snapshots', async () => {
    await load();
    fetchMock.mockResolvedValue(ok({ snapshots: [{ id: 4, version: 2 }] }));
    expect(await CloudStore.listSnapshots()).toEqual([{ id: 4, version: 2 }]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/snapshots');
  });

  it('restore adopts the returned document and fires onReplace with restore', async () => {
    setCache({ a: 2 }, { version: 2, dirty: false, savedAt: 't2' });
    await load();
    fetchMock.mockResolvedValue(ok({ version: 3, data: { a: 1 }, updatedAt: 't3', updatedBy: 'mom@x' }));
    const replaced = vi.fn();
    CloudStore.onReplace(replaced);
    const remote = await CloudStore.restoreSnapshot(4);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/snapshots/4/restore');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(remote.version).toBe(3);
    expect(replaced).toHaveBeenCalledWith({ a: 1 }, 'restore');
    expect(cache()).toEqual({ a: 1 });
    expect(meta()).toEqual({ version: 3, dirty: false, savedAt: 't3' });
  });

  it('does not let a slow PUT response roll back the version after a restore', async () => {
    await load();
    let resolveFirst;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    fetchMock.mockResolvedValueOnce(ok({ version: 3, data: { a: 0 }, updatedAt: 't3', updatedBy: 'mom@x' }));
    CloudStore.save({ a: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    await CloudStore.restoreSnapshot(9);
    expect(meta().version).toBe(3);

    resolveFirst(ok({ version: 2, updatedAt: 't2' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(meta()).toEqual({ version: 3, dirty: false, savedAt: 't3' });
    expect(putCalls()).toHaveLength(1);
  });
});
