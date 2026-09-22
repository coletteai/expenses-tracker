// Exercises the passphrase sign-in: /login, /api/login, /api/logout, and the
// cookie-gated routing in front of the existing document endpoints.
import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker, { signSession, verifySession } from '../src/worker.js';

const BASE = 'https://household.example';

const testEnv = Object.assign({}, env, {
  DEV_EMAIL: undefined,
  SESSION_SECRET: 'test-session-secret',
  HOUSEHOLD_PASSPHRASE: 'correct horse battery',
  LOGIN_DELAY_MS: '0',
});

// The pool does not isolate storage between tests in this version, so clear the tables explicitly.
beforeEach(async () => {
  await env.DB.batch([env.DB.prepare('DELETE FROM snapshot'), env.DB.prepare('DELETE FROM document')]);
});

function fetchWorker(path, init) {
  return worker.fetch(new Request(BASE + path, init), testEnv, {});
}

function login(name, passphrase) {
  return fetchWorker('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, passphrase }),
  });
}

function cookiePair(res) {
  const setCookie = res.headers.get('set-cookie');
  return setCookie ? setCookie.split(';')[0] : null;
}

function tamperLastChar(s) {
  const last = s.slice(-1);
  return s.slice(0, -1) + (last === 'a' ? 'b' : 'a');
}

describe('unauthenticated routing', () => {
  it('redirects the app to /login when there is no cookie', async () => {
    const res = await fetchWorker('/', { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/\/login$/);
  });

  it('serves the login page at /login when there is no cookie', async () => {
    const res = await fetchWorker('/login');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('Passphrase');
  });

  it('serves public static assets without a cookie', async () => {
    for (const path of ['/login.html', '/manifest.json', '/icons/icon-512.png']) {
      const res = await fetchWorker(path);
      expect(res.status, path).toBe(200);
    }
  });

  it('returns 401 unauthenticated for /api/doc without a cookie', async () => {
    const res = await fetchWorker('/api/doc');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
  });
});

describe('POST /api/login', () => {
  it('rejects the wrong passphrase after the configured delay, and sets no cookie', async () => {
    const res = await login('Mom', 'not the passphrase');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid' });
    expect(res.headers.has('set-cookie')).toBe(false);
  });

  it('rejects a missing name, an over-long name, and an unparseable body with 400', async () => {
    const empty = await login('   ', 'correct horse battery');
    expect(empty.status).toBe(400);
    expect(await empty.json()).toEqual({ error: 'name required' });

    const tooLong = await login('x'.repeat(41), 'correct horse battery');
    expect(tooLong.status).toBe(400);
    expect(await tooLong.json()).toEqual({ error: 'name required' });

    const badJson = await fetchWorker('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    expect(badJson.status).toBe(400);
    expect(await badJson.json()).toEqual({ error: 'invalid json' });
  });

  it('returns 503 when HOUSEHOLD_PASSPHRASE is not configured', async () => {
    const unconfigured = Object.assign({}, testEnv, { HOUSEHOLD_PASSPHRASE: undefined });
    const res = await worker.fetch(new Request(BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mom', passphrase: 'correct horse battery' }),
    }), unconfigured, {});
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not configured' });
  });

  it('accepts the right passphrase, trims the name, and sets a valid year-long cookie', async () => {
    const res = await login('  Mom ', 'correct horse battery');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: 'Mom' });

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toMatch(/^session=/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Max-Age=31536000');

    const token = setCookie.split(';')[0].slice('session='.length);
    expect(await verifySession('test-session-secret', token)).toBe('Mom');
  });
});

describe('with a valid session cookie', () => {
  let cookie;

  beforeEach(async () => {
    const res = await login('Mom', 'correct horse battery');
    cookie = cookiePair(res);
  });

  it('reaches the document API and the app using the cookie', async () => {
    const empty = await fetchWorker('/api/doc', { headers: { Cookie: cookie } });
    expect(empty.status).toBe(404);

    const put = await fetchWorker('/api/doc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ baseVersion: null, data: { a: 1 } }),
    });
    expect(put.status).toBe(200);
    const row = await env.DB.prepare('SELECT updated_by FROM document WHERE id = 1').first('updated_by');
    expect(row).toBe('Mom');

    const app = await fetchWorker('/', { headers: { Cookie: cookie } });
    expect(app.status).toBe(200);
    expect(app.headers.get('content-type')).toContain('text/html');

    const loginPage = await fetchWorker('/login', { headers: { Cookie: cookie }, redirect: 'manual' });
    expect(loginPage.status).toBe(302);
    expect(loginPage.headers.get('location')).toMatch(/\/$/);
  });
});

describe('session tampering', () => {
  it('rejects a cookie with a tampered signature', async () => {
    const res = await login('Mom', 'correct horse battery');
    const token = cookiePair(res).slice('session='.length);
    const tampered = 'session=' + tamperLastChar(token);
    const doc = await fetchWorker('/api/doc', { headers: { Cookie: tampered } });
    expect(doc.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const token = await signSession('test-session-secret', 'Mom', Math.floor(Date.now() / 1000) - 10);
    const doc = await fetchWorker('/api/doc', { headers: { Cookie: 'session=' + token } });
    expect(doc.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signSession('some-other-secret', 'Mom', Math.floor(Date.now() / 1000) + 1000);
    const doc = await fetchWorker('/api/doc', { headers: { Cookie: 'session=' + token } });
    expect(doc.status).toBe(401);
  });
});

describe('POST /api/logout', () => {
  it('clears the session cookie', async () => {
    const res = await fetchWorker('/api/logout', { method: 'POST' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
