// Household Expenses API. One household per deployment.
// Routes: GET /api/doc, PUT /api/doc, GET /api/snapshots, POST /api/snapshots/:id/restore
// Sign-in: POST /api/login, POST /api/logout, and the /login page.
// Everything else outside /api/ is served from the public/ folder by the ASSETS binding.

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const SNAPSHOT_KEEP = 100;

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;
const DEFAULT_LOGIN_DELAY_MS = 1000;
const MAX_NAME_LENGTH = 40;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/login' && request.method === 'POST') return handleLogin(request, env);
    if (path === '/api/logout' && request.method === 'POST') return handleLogout();

    const identity = await resolveIdentity(request, url, env);

    if (path.startsWith('/api/')) {
      if (!identity) return json({ error: 'unauthenticated' }, 401);
      try {
        return await route(request, url, env, identity);
      } catch (e) {
        return json({ error: 'internal', message: String(e && e.message) }, 500);
      }
    }

    // Always public: the login page itself and the static assets it (and the installed app) need.
    if (path === '/login.html' || path === '/manifest.json' || path.startsWith('/icons/')) {
      return env.ASSETS.fetch(request);
    }

    if (path === '/login') {
      if (identity) return Response.redirect(url.origin + '/', 302);
      // Fetch the extensionless form: Cloudflare's default asset handling 307-redirects a
      // *.html request to this clean URL, and re-requesting /login.html here would loop.
      return env.ASSETS.fetch(new Request(url.origin + '/login', request));
    }

    if (!identity) return Response.redirect(url.origin + '/login', 302);
    return env.ASSETS.fetch(request);
  },
};

// ---------- identity ----------

// Identity comes from a signed session cookie set by /api/login. DEV_EMAIL is a local
// development and test shortcut, honored only when the request hostname is localhost
// or 127.0.0.1, so it can never stand in for sign-in on a real deployment.
async function resolveIdentity(request, url, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    const name = await verifySession(env.SESSION_SECRET, token);
    if (name) return name;
  }
  if (env.DEV_EMAIL && isLocalHostname(url.hostname)) return env.DEV_EMAIL;
  return null;
}

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

// ---------- login / logout ----------

async function handleLogin(request, env) {
  if (!env.SESSION_SECRET || !env.HOUSEHOLD_PASSPHRASE) return json({ error: 'not configured' }, 503);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }
  if (typeof body !== 'object' || body === null) body = {};

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > MAX_NAME_LENGTH) return json({ error: 'name required' }, 400);

  const passphrase = typeof body.passphrase === 'string' ? body.passphrase : '';
  const match = await passphraseMatches(passphrase, env.HOUSEHOLD_PASSPHRASE);
  if (!match) {
    await sleep(loginDelayMs(env));
    return json({ error: 'invalid' }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const token = await signSession(env.SESSION_SECRET, name, exp);
  return json({ name }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_MAX_AGE) });
}

function handleLogout() {
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}

function loginDelayMs(env) {
  if (env.LOGIN_DELAY_MS === undefined) return DEFAULT_LOGIN_DELAY_MS;
  const n = Number(env.LOGIN_DELAY_MS);
  return Number.isFinite(n) ? n : DEFAULT_LOGIN_DELAY_MS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- session token ----------
// <payload>.<signature>, both base64url. payload is {"name","exp"} JSON; signature is
// HMAC-SHA256 over the payload, keyed by SESSION_SECRET. Exported so tests can build tokens.

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signSession(secret, name, exp) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ name, exp })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(payload)));
  return payload + '.' + b64url(sig);
}
export async function verifySession(secret, token) {
  if (typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), b64urlToBytes(sig), new TextEncoder().encode(payload));
  } catch (e) { return null; }
  if (!ok) return null;
  let data;
  try { data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload))); } catch (e) { return null; }
  if (!data || typeof data.name !== 'string' || typeof data.exp !== 'number') return null;
  if (data.exp <= Math.floor(Date.now() / 1000)) return null;
  return data.name;
}
async function passphraseMatches(provided, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(provided)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}
function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}
function sessionCookie(token, maxAge) {
  return SESSION_COOKIE + '=' + token + '; Path=/; Max-Age=' + maxAge + '; HttpOnly; Secure; SameSite=Lax';
}

async function route(request, url, env, identity) {
  const path = url.pathname;
  const method = request.method;
  if (path === '/api/doc' && method === 'GET') return getDoc(env);
  if (path === '/api/doc' && method === 'PUT') return putDoc(request, env, identity);
  if (path === '/api/snapshots' && method === 'GET') return listSnapshots(env);
  const m = path.match(/^\/api\/snapshots\/(\d+)\/restore$/);
  if (m && method === 'POST') return restoreSnapshot(Number(m[1]), env, identity);
  return json({ error: 'not found' }, 404);
}

// ---------- document ----------

function readDocRow(env) {
  return env.DB.prepare('SELECT version, data, updated_at, updated_by FROM document WHERE id = 1').first();
}

function docBody(row, extra) {
  return Object.assign({}, extra || {}, {
    version: row.version,
    data: JSON.parse(row.data),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  });
}

async function getDoc(env) {
  const row = await readDocRow(env);
  if (!row) return json({ error: 'empty' }, 404);
  return json(docBody(row));
}

async function putDoc(request, env, email) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);

  let body;
  try { body = JSON.parse(text); } catch (e) { return json({ error: 'invalid json' }, 400); }
  if (!isPlainObject(body) || !isPlainObject(body.data)) return json({ error: 'data must be an object' }, 400);
  const base = body.baseVersion;
  if (!(base === null || Number.isInteger(base))) return json({ error: 'baseVersion must be an integer or null' }, 400);

  const dataText = JSON.stringify(body.data);
  const now = new Date().toISOString();

  let written = base === null
    ? await insertFirstVersion(env, dataText, now, email)
    : await updateVersion(env, dataText, now, email, base);

  if (!written && base !== null) {
    // The client believes a document exists but the table is empty (fresh or reset database).
    // Treat the save as the first version instead of refusing it.
    const row = await readDocRow(env);
    if (!row) written = await insertFirstVersion(env, dataText, now, email);
  }

  if (!written) {
    const row = await readDocRow(env);
    return json(docBody(row, { error: 'conflict' }), 409);
  }

  await recordSnapshot(env);
  const row = await readDocRow(env);
  return json({ version: row.version, updatedAt: row.updated_at });
}

async function insertFirstVersion(env, dataText, now, email) {
  const r = await env.DB
    .prepare('INSERT OR IGNORE INTO document (id, version, data, updated_at, updated_by) VALUES (1, 1, ?, ?, ?)')
    .bind(dataText, now, email)
    .run();
  return r.meta.changes === 1;
}

async function updateVersion(env, dataText, now, email, base) {
  const r = await env.DB
    .prepare('UPDATE document SET version = version + 1, data = ?, updated_at = ?, updated_by = ? WHERE id = 1 AND version = ?')
    .bind(dataText, now, email, base)
    .run();
  return r.meta.changes === 1;
}

// Copies the current document into the snapshot table and prunes old rows. Runs only after a successful write.
function recordSnapshot(env) {
  return env.DB.batch([
    env.DB.prepare('INSERT INTO snapshot (version, data, updated_by, created_at) SELECT version, data, updated_by, updated_at FROM document WHERE id = 1'),
    env.DB.prepare('DELETE FROM snapshot WHERE id NOT IN (SELECT id FROM snapshot ORDER BY id DESC LIMIT ?)').bind(SNAPSHOT_KEEP),
  ]);
}

// ---------- snapshots ----------

async function listSnapshots(env) {
  const { results } = await env.DB
    .prepare('SELECT id, version, updated_by, created_at, length(data) AS bytes FROM snapshot ORDER BY id DESC LIMIT ?')
    .bind(SNAPSHOT_KEEP)
    .all();
  return json({
    snapshots: results.map((r) => ({ id: r.id, version: r.version, createdAt: r.created_at, updatedBy: r.updated_by, bytes: r.bytes })),
  });
}

async function restoreSnapshot(id, env, email) {
  const snap = await env.DB.prepare('SELECT data FROM snapshot WHERE id = ?').bind(id).first();
  if (!snap) return json({ error: 'not found' }, 404);
  const now = new Date().toISOString();
  const r = await env.DB
    .prepare('UPDATE document SET version = version + 1, data = ?, updated_at = ?, updated_by = ? WHERE id = 1')
    .bind(snap.data, now, email)
    .run();
  if (r.meta.changes === 0) await insertFirstVersion(env, snap.data, now, email);
  await recordSnapshot(env);
  const row = await readDocRow(env);
  return json(docBody(row));
}

// ---------- helpers ----------

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function json(obj, status, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extraHeaders || {}),
  });
}
