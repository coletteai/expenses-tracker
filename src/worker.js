// Household Expenses API. One household per deployment.
// Routes: GET /api/doc, PUT /api/doc, GET /api/snapshots, POST /api/snapshots/:id/restore
// Everything outside /api/ is served from the public/ folder by the ASSETS binding.

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const SNAPSHOT_KEEP = 100;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const email = await resolveEmail(ctx, env);
    if (!email) return json({ error: 'unauthenticated' }, 401);

    try {
      return await route(request, url, env, email);
    } catch (e) {
      return json({ error: 'internal', message: String(e && e.message) }, 500);
    }
  },
};

// Identity comes from Cloudflare Access when it is bound to this Worker.
// DEV_EMAIL exists only in .dev.vars (wrangler dev) and in test bindings.
async function resolveEmail(ctx, env) {
  try {
    if (ctx && ctx.access && typeof ctx.access.getIdentity === 'function') {
      const identity = await ctx.access.getIdentity();
      if (identity && identity.email) return identity.email;
    }
  } catch (e) {
    // fall through to the dev path
  }
  return env.DEV_EMAIL || null;
}

async function route(request, url, env, email) {
  const path = url.pathname;
  const method = request.method;
  if (path === '/api/doc' && method === 'GET') return getDoc(env);
  if (path === '/api/doc' && method === 'PUT') return putDoc(request, env, email);
  if (path === '/api/snapshots' && method === 'GET') return listSnapshots(env);
  const m = path.match(/^\/api\/snapshots\/(\d+)\/restore$/);
  if (m && method === 'POST') return restoreSnapshot(Number(m[1]), env, email);
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

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
