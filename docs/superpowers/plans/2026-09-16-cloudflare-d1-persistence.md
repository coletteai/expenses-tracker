# Cloud Persistence on Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the single-file household expenses tracker to a Cloudflare Worker with a D1 database and Cloudflare Access login, so the data lives in the cloud, survives any device, and can be restored to a previous version.

**Architecture:** The app stays a static, no-build page, split into `public/index.html`, `styles.css`, `app.js`, and a new `storage.js` adapter that is the only code touching `localStorage` and `/api/`. A sixty-line Worker serves `public/` as static assets and exposes four JSON endpoints over one D1 table holding a single JSON document plus a snapshot table for undo. Cloudflare Access sits in front of everything, so the app has no login code.

**Tech Stack:** Cloudflare Workers with static assets, D1 (SQLite), Cloudflare Access (one-time email PIN), wrangler 4, vitest 4 with `@cloudflare/vitest-pool-workers` for the Worker and jsdom for the adapter. Plain HTML, CSS, and classic-script JavaScript. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-16-cloudflare-d1-persistence-design.md`

## Global Constraints

- No framework, no bundler, no build step. `public/` files are plain HTML, CSS, and classic (non-module) scripts, because the markup uses inline `onclick` handlers that reference globals.
- `public/` is the only folder the UI maintainer edits. Everything else belongs to the operator.
- The JSON document keeps exactly today's shape. The cache key stays `household-expenses-v1`. The meta key is `household-expenses-v1.meta`.
- One household per deployment. Data is not scoped by user.
- `compatibility_date` is `2026-08-22`, the newest date the local test runtime bundled with wrangler 4.132 supports.
- Dev dependencies and versions: `wrangler ^4.132.0`, `vitest ^4.1.0`, `@cloudflare/vitest-pool-workers ^0.22.0`, `jsdom ^30.0.1`. No runtime dependencies. `@cloudflare/vitest-pool-workers` 0.22 requires vitest 4, not 5.
- Worker limits: request bodies over 5 MB get 413. Snapshots are pruned to the newest 100.
- Status names are exactly `saved`, `unsaved`, `offline`, `disconnected`. Replace reasons are exactly `refresh`, `conflict`, `restore`.
- User-facing copy, verbatim: banner `unsaved` reads "Not saved to cloud yet. Will retry."; banner `offline` reads "Can't reach the cloud. Showing your last saved copy."; banner `disconnected` reads "Signed out. Reload to sign in again."; conflict toast reads "Another device changed the data. Your last change was not saved. Please redo it."; restore toast reads "Restored version N."
- No em dashes in any new text, code comments, or commit messages. Existing strings in the friend's code are left as they are.
- Commits: run `git commit -m "<message>"` with exactly the message shown and no Co-Authored-By or Generated-with trailers, so commits appear user-authored. When executing interactively, the user's `/commit` skill may be used instead. Never commit `.dev.vars`, `node_modules/`, or `.wrangler/`.
- Test commands: `npm run test:worker` (Cloudflare pool, local D1), `npm run test:storage` (jsdom), `npm test` runs both.

---

## File structure

| Path | Responsibility |
|---|---|
| `package.json` | Scripts and dev dependencies. No runtime dependencies. |
| `wrangler.jsonc` | Worker name, static assets from `public/`, D1 binding `DB`, migrations folder. |
| `migrations/0001_init.sql` | The two tables. |
| `src/worker.js` | The API: routing, identity, document read and write with version check, snapshots, restore. |
| `public/index.html` | Markup only. Links `styles.css`, loads `storage.js` then `app.js`. |
| `public/styles.css` | Today's CSS moved verbatim, plus the cloud banner and version list styles. |
| `public/app.js` | Today's script moved verbatim, with `loadData`, `saveData`, and `init` rewired to `CloudStore`, plus the banner and the Settings cloud section. |
| `public/storage.js` | `CloudStore`: cache, meta, debounced saves, startup decision, refresh, flush, conflicts, snapshots. |
| `public/manifest.json`, `public/icons/*.png` | Home-screen name and icon. |
| `vitest.config.js` | Worker tests under the Cloudflare pool with migrations applied. |
| `vitest.storage.config.js` | Adapter tests under jsdom. |
| `test/apply-migrations.js` | Setup file that applies migrations to the test D1. |
| `test/worker.test.js`, `test/worker-noidentity.test.js` | Worker behavior, including the identity paths. |
| `test/storage.test.js` | Adapter behavior with a fake `fetch` and fake timers. |
| `.dev.vars.example`, `.gitignore` | Local dev email template; ignore secrets and build state. |
| `README.md` | Setup, local development, tests, handover, backup commands. |

Original `index.html` line map used by Task 2: lines 1 to 6 are the doctype through `<title>`, lines 8 to 237 are the CSS inside `<style>`, line 240 is `<body>`, lines 241 to 377 are the body markup, lines 379 to 1701 are the script (the last line is `init();`), lines 1702 to 1704 close the file.

---

### Task 1: Project scaffold and database schema

**Files:**
- Create: `package.json`, `wrangler.jsonc`, `migrations/0001_init.sql`, `vitest.config.js`, `vitest.storage.config.js`, `test/apply-migrations.js`, `.dev.vars.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: D1 binding `env.DB`, assets binding `env.ASSETS`, dev variable `env.DEV_EMAIL`, tables `document` and `snapshot` with the columns below, npm scripts `dev`, `migrate`, `migrate:local`, `deploy`, `test`, `test:worker`, `test:storage`.

- [ ] **Step 1: Create the working branch**

```bash
git checkout -b cloud-persistence main
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "household-expenses",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "migrate": "wrangler d1 migrations apply household-expenses --remote",
    "migrate:local": "wrangler d1 migrations apply household-expenses --local",
    "deploy": "npm run migrate && wrangler deploy",
    "test": "npm run test:worker && npm run test:storage",
    "test:worker": "vitest run --config vitest.config.js",
    "test:storage": "vitest run --config vitest.storage.config.js"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.22.0",
    "jsdom": "^30.0.1",
    "vitest": "^4.1.0",
    "wrangler": "^4.132.0"
  }
}
```

- [ ] **Step 3: Write wrangler.jsonc**

The database id is a placeholder that local development and tests accept. Task 8 replaces it with the real id.

```jsonc
{
  "name": "household-expenses",
  "main": "src/worker.js",
  "compatibility_date": "2026-08-22",
  "workers_dev": true,
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "household-expenses",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ],
  "observability": { "enabled": true }
}
```

- [ ] **Step 4: Write the migration**

`migrations/0001_init.sql`:

```sql
CREATE TABLE document (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  version     INTEGER NOT NULL,
  data        TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,
  updated_by  TEXT    NOT NULL
);

CREATE TABLE snapshot (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  version     INTEGER NOT NULL,
  data        TEXT    NOT NULL,
  updated_by  TEXT    NOT NULL,
  created_at  TEXT    NOT NULL
);
```

- [ ] **Step 5: Write the two vitest configs and the migration setup file**

`vitest.config.js`:

```js
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(fileURLToPath(new URL("./migrations", import.meta.url)));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: { bindings: { TEST_MIGRATIONS: migrations, DEV_EMAIL: "test@example.com" } },
      }),
    ],
    test: {
      include: ["test/worker*.test.js"],
      setupFiles: ["./test/apply-migrations.js"],
    },
  };
});
```

`vitest.storage.config.js`:

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/storage.test.js"], environment: "jsdom" },
});
```

`test/apply-migrations.js`:

```js
import { applyD1Migrations, env } from "cloudflare:test";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
```

- [ ] **Step 6: Write .dev.vars.example and extend .gitignore**

`.dev.vars.example`:

```
# Copy to .dev.vars for local development. Never commit .dev.vars.
# The email the Worker treats as signed in when Cloudflare Access is not in front of it.
DEV_EMAIL=you@example.com
```

Append to `.gitignore` so it reads:

```
data-export.json
*.bak-*
.DS_Store
node_modules/
.wrangler/
.dev.vars
```

- [ ] **Step 7: Install and apply the migration locally**

Run:

```bash
npm install
npm run migrate:local
```

Expected: the install completes, and the migrate output ends with `Migrations completed successfully` for `0001_init.sql`. Answer `y` if it asks to confirm.

- [ ] **Step 8: Verify the schema exists**

Run:

```bash
npx wrangler d1 execute household-expenses --local --command "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
```

Expected: the result lists `d1_migrations`, `document`, and `snapshot` (plus `sqlite_sequence`).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json wrangler.jsonc migrations/0001_init.sql vitest.config.js vitest.storage.config.js test/apply-migrations.js .dev.vars.example .gitignore
git commit -m "Add Cloudflare Worker scaffold, D1 schema, and test configs"
```

---

### Task 2: Split index.html into public/ files without changing behavior

**Files:**
- Move: `index.html` to `public/index.html`
- Create: `public/styles.css`, `public/app.js`, `public/manifest.json`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`, `scripts/make-icons.py`

**Interfaces:**
- Produces: `public/app.js` with all of today's globals (`data`, `loadData`, `saveData`, `init`, `renderTabs`, `renderContent`, `showToast`, `openSettings`, `closeSettings`, and the rest), unchanged. Later tasks edit functions by name.

- [ ] **Step 1: Move the file so git history follows it**

```bash
git mv index.html public/index.html
```

- [ ] **Step 2: Extract the CSS and the script verbatim**

```bash
sed -n '8,237p' public/index.html > public/styles.css
sed -n '379,1701p' public/index.html > public/app.js
```

Check: `head -1 public/styles.css` prints the `* { box-sizing: border-box; ...` rule, `tail -1 public/styles.css` prints `.toast.show { opacity: 1; }`, `head -1 public/app.js` prints a line starting with `// ` or `const`, and `tail -1 public/app.js` prints `init();`.

- [ ] **Step 3: Rebuild index.html as markup only**

```bash
{
  sed -n '1,6p' public/index.html
  cat <<'EOF'
<meta name="theme-color" content="#ffffff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Expenses">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="styles.css">
</head>
<body>
EOF
  sed -n '241,377p' public/index.html
  cat <<'EOF'
<script src="app.js"></script>
</body>
</html>
EOF
} > public/index.new.html && mv public/index.new.html public/index.html
```

Check:

```bash
grep -c '<style>' public/index.html; grep -n '<script' public/index.html; wc -l public/index.html public/styles.css public/app.js
```

Expected: `0`, exactly one script line `<script src="app.js"></script>`, and roughly 152, 230, and 1323 lines.

- [ ] **Step 4: Add the manifest and icons**

`public/manifest.json`:

```json
{
  "name": "Expenses",
  "short_name": "Expenses",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#f2f2f7",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

`scripts/make-icons.py` (dependency-free; the PNGs are solid green squares that anyone can replace with artwork later):

```python
# Writes solid-color PNG icons with no dependencies. Run: python3 scripts/make-icons.py
import struct
import zlib


def png(path, size, rgb):
    raw = b''.join(b'\x00' + bytes(rgb) * size for _ in range(size))

    def chunk(tag, body):
        return struct.pack('>I', len(body)) + tag + body + struct.pack('>I', zlib.crc32(tag + body) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(data)


png('public/icons/icon-512.png', 512, (52, 199, 89))
png('public/icons/apple-touch-icon.png', 180, (52, 199, 89))
print('icons written')
```

Run:

```bash
mkdir -p public/icons && python3 scripts/make-icons.py && file public/icons/*.png
```

Expected: both files report `PNG image data`, 512 x 512 and 180 x 180.

- [ ] **Step 5: Verify the split app behaves exactly as before**

Serve the folder statically (no Worker yet) and open it in the browser:

```bash
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000/`. Expected: the app renders with its tabs and header; adding a payment to a bill and reloading keeps it (still localStorage); the browser console shows no errors. Stop the server afterwards.

- [ ] **Step 6: Commit**

```bash
git add public scripts
git commit -m "Split index.html into public/ markup, styles, and script"
```

---

### Task 3: Worker API with tests

**Files:**
- Create: `src/worker.js`, `test/worker.test.js`, `test/worker-noidentity.test.js`

**Interfaces:**
- Consumes: bindings `DB`, `ASSETS`, `DEV_EMAIL` from Task 1.
- Produces the HTTP API used by `storage.js` in Task 4:
  - `GET /api/doc` returns 200 `{ version, data, updatedAt, updatedBy }` or 404 `{ error: "empty" }`.
  - `PUT /api/doc` with `{ baseVersion: number|null, data: object }` returns 200 `{ version, updatedAt }`, 409 `{ error: "conflict", version, data, updatedAt, updatedBy }`, 400, or 413.
  - `GET /api/snapshots` returns 200 `{ snapshots: [{ id, version, createdAt, updatedBy, bytes }] }`, newest first.
  - `POST /api/snapshots/:id/restore` returns 200 `{ version, data, updatedAt, updatedBy }` or 404.
  - Any `/api/*` request without an identity returns 401 `{ error: "unauthenticated" }`.

- [ ] **Step 1: Write the failing Worker tests**

`test/worker.test.js`:

```js
import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';

const BASE = 'https://example.com';

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
```

`test/worker-noidentity.test.js`:

```js
// Runs the Worker with no DEV_EMAIL binding: every API call must be refused,
// and an Access identity supplied by the runtime must be used when present.
import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/worker.js';

describe('identity', () => {
  it('returns 401 when neither Access nor DEV_EMAIL provides an email', async () => {
    const envWithoutEmail = Object.assign({}, env, { DEV_EMAIL: undefined });
    const res = await worker.fetch(new Request('https://example.com/api/doc'), envWithoutEmail, {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
  });

  it('uses the Access identity when the runtime provides one', async () => {
    const ctx = { access: { getIdentity: async () => ({ email: 'mom@example.com' }) } };
    const envWithoutEmail = Object.assign({}, env, { DEV_EMAIL: undefined });
    const res = await worker.fetch(new Request('https://example.com/api/doc', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseVersion: null, data: { a: 1 } }),
    }), envWithoutEmail, ctx);
    expect(res.status).toBe(200);
    const row = await env.DB.prepare('SELECT updated_by FROM document WHERE id = 1').first('updated_by');
    expect(row).toBe('mom@example.com');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:worker`

Expected: a startup or import failure because `src/worker.js` does not exist (the pool cannot resolve the Worker's `main`). No test passes.

- [ ] **Step 3: Write the Worker**

`src/worker.js`:

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:worker`

Expected: `Test Files 2 passed (2)`, `Tests 16 passed (16)`.

- [ ] **Step 5: Commit**

```bash
git add src/worker.js test/worker.test.js test/worker-noidentity.test.js
git commit -m "Add Worker API with versioned document, snapshots, and restore"
```

---

### Task 4: Storage adapter with tests

**Files:**
- Create: `public/storage.js`, `test/storage.test.js`

**Interfaces:**
- Consumes: the API from Task 3.
- Produces the global `window.CloudStore` used by `app.js` in Tasks 5 and 6:
  - `loadCached()` returns the cached document object or `null`.
  - `save(data)` writes the cache now and schedules a PUT one second after the last call.
  - `start(localData)` returns a promise; runs the startup decision (adopt newer remote, save dirty cache, or upload when the remote is empty).
  - `refresh()` returns a promise; adopts a newer remote when the cache is clean, otherwise saves.
  - `flush()` returns a promise; sends a pending save immediately with `keepalive`.
  - `listSnapshots()` resolves to the snapshot array; `restoreSnapshot(id)` resolves to the restored document response.
  - `onReplace(fn)` calls `fn(data, reason)` with reason `refresh`, `conflict`, or `restore`.
  - `onStatus(fn)` calls `fn(status, savedAt)` with status `saved`, `unsaved`, `offline`, or `disconnected`.
  - `meta()` returns `{ version, dirty, savedAt }`; `status()` returns the current status.

- [ ] **Step 1: Write the failing adapter tests**

`test/storage.test.js`:

```js
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
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:storage`

Expected: every test fails with an import error for `../public/storage.js` (file not found).

- [ ] **Step 3: Write the adapter**

`public/storage.js`:

```js
// CloudStore: the only code that knows about localStorage and /api/.
// Loaded as a classic script before app.js. Exposes window.CloudStore.
(function (root) {
  'use strict';

  var CACHE_KEY = 'household-expenses-v1';
  var META_KEY = 'household-expenses-v1.meta';
  var DEBOUNCE_MS = 1000;

  function AuthError() { this.name = 'AuthError'; this.message = 'Signed out'; }
  AuthError.prototype = Object.create(Error.prototype);
  function NetworkError(message) { this.name = 'NetworkError'; this.message = message || 'Network error'; }
  NetworkError.prototype = Object.create(Error.prototype);

  var meta = readMeta();          // { version, dirty, savedAt }
  var timer = null;               // debounce timer id
  var inFlight = false;           // a PUT is running
  var queued = false;             // data changed while a PUT was running
  var status = 'saved';           // saved | unsaved | offline | disconnected
  var replaceHandlers = [];
  var statusHandlers = [];

  // ---------- local cache ----------

  function readMeta() {
    var fallback = { version: null, dirty: false, savedAt: null };
    try {
      var raw = localStorage.getItem(META_KEY);
      return raw ? Object.assign(fallback, JSON.parse(raw)) : fallback;
    } catch (e) { return fallback; }
  }
  function writeMeta() { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
  function readCache() {
    var raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function writeCache(data) { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }

  // ---------- notifications ----------

  function setStatus(next) {
    status = next;
    statusHandlers.forEach(function (fn) { try { fn(next, meta.savedAt); } catch (e) { /* listener error must not break saving */ } });
  }
  function notifyReplace(data, reason) {
    replaceHandlers.forEach(function (fn) { try { fn(data, reason); } catch (e) { /* same */ } });
  }
  function failureStatus(err) {
    if (err instanceof AuthError) return 'disconnected';
    return meta.dirty ? 'unsaved' : 'offline';
  }

  // ---------- network ----------

  function request(method, path, body, extra) {
    var init = Object.assign({
      method: method,
      credentials: 'same-origin',
      redirect: 'manual',
      headers: body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    }, extra || {});
    if (body !== undefined) init.body = JSON.stringify(body);
    return fetch(path, init).then(null, function (e) {
      throw new NetworkError(e && e.message);
    }).then(function (res) {
      var redirected = res.status >= 300 && res.status < 400;
      if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403 || redirected) throw new AuthError();
      return res;
    });
  }

  function adoptRemote(remote) {
    writeCache(remote.data);
    meta = { version: remote.version, dirty: false, savedAt: remote.updatedAt || null };
    writeMeta();
  }

  function fetchRemote() {
    return request('GET', '/api/doc').then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new NetworkError('HTTP ' + res.status);
      return res.json();
    });
  }

  function putNow(keepalive) {
    var data = readCache();
    if (data === null) return Promise.resolve();
    inFlight = true;
    return request('PUT', '/api/doc', { baseVersion: meta.version, data: data }, keepalive ? { keepalive: true } : undefined)
      .then(function (res) {
        if (res.status === 409) {
          return res.json().then(function (remote) {
            queued = false;
            adoptRemote(remote);
            setStatus('saved');
            notifyReplace(remote.data, 'conflict');
          });
        }
        if (!res.ok) throw new NetworkError('HTTP ' + res.status);
        return res.json().then(function (body) {
          meta.version = body.version;
          meta.savedAt = body.updatedAt;
          if (!queued) meta.dirty = false;
          writeMeta();
          if (!queued) setStatus('saved');
        });
      })
      .then(function () { finish(); }, function (e) {
        setStatus(failureStatus(e));
        finish();
        throw e;
      });
  }
  function finish() {
    inFlight = false;
    if (queued) { queued = false; schedule(0); }
  }

  function schedule(ms) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; runSave(false); }, ms);
  }
  function runSave(keepalive) {
    if (inFlight) { queued = true; return Promise.resolve(); }
    return putNow(keepalive).then(null, function () { /* status already reported */ });
  }
  function cancelTimer() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  }

  // ---------- public surface ----------

  var CloudStore = {
    AuthError: AuthError,
    NetworkError: NetworkError,

    loadCached: function () { return readCache(); },
    meta: function () { return Object.assign({}, meta); },
    status: function () { return status; },

    // Called after every user action. Writes the cache now, the cloud a second later.
    save: function (data) {
      writeCache(data);
      meta.dirty = true;
      writeMeta();
      schedule(DEBOUNCE_MS);
    },

    // Called when the page is hidden or unloading.
    flush: function () {
      cancelTimer();
      if (!meta.dirty) return Promise.resolve();
      return runSave(true);
    },

    // Called once at startup with the in-memory data (cache or fresh seed).
    start: function (localData) {
      return fetchRemote().then(function (remote) {
        if (remote === null) {
          writeCache(localData);
          meta.version = null;
          meta.dirty = true;
          writeMeta();
          return runSave(false);
        }
        if (meta.dirty) return runSave(false);
        if (meta.version === null || remote.version > meta.version) {
          adoptRemote(remote);
          setStatus('saved');
          notifyReplace(remote.data, 'refresh');
          return;
        }
        setStatus('saved');
      }, function (e) {
        setStatus(failureStatus(e));
      });
    },

    // Called when the tab regains focus or the network comes back.
    refresh: function () {
      if (meta.dirty) return runSave(false);
      return fetchRemote().then(function (remote) {
        if (remote && (meta.version === null || remote.version > meta.version)) {
          adoptRemote(remote);
          setStatus('saved');
          notifyReplace(remote.data, 'refresh');
          return;
        }
        if (status !== 'saved') setStatus('saved');
      }, function (e) {
        setStatus(failureStatus(e));
      });
    },

    listSnapshots: function () {
      return request('GET', '/api/snapshots').then(function (res) {
        if (!res.ok) throw new NetworkError('HTTP ' + res.status);
        return res.json();
      }).then(function (body) { return body.snapshots; });
    },

    restoreSnapshot: function (id) {
      return request('POST', '/api/snapshots/' + id + '/restore').then(function (res) {
        if (!res.ok) throw new NetworkError('HTTP ' + res.status);
        return res.json();
      }).then(function (remote) {
        cancelTimer();
        queued = false;
        adoptRemote(remote);
        setStatus('saved');
        notifyReplace(remote.data, 'restore');
        return remote;
      });
    },

    onReplace: function (fn) { replaceHandlers.push(fn); },
    onStatus: function (fn) { statusHandlers.push(fn); },
  };

  root.CloudStore = CloudStore;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:storage`

Expected: `Test Files 1 passed (1)`, `Tests 16 passed (16)`.

- [ ] **Step 5: Commit**

```bash
git add public/storage.js test/storage.test.js
git commit -m "Add CloudStore adapter with debounced saves, conflicts, and snapshots"
```

---

### Task 5: Wire the app to CloudStore and add the status banner

**Files:**
- Modify: `public/app.js` (functions `loadData`, `saveData`, `init`), `public/index.html` (script tags, banner markup), `public/styles.css` (banner styles)

**Interfaces:**
- Consumes: `CloudStore` from Task 4.
- Produces: globals `replaceData(data, reason)` and `updateCloudBanner(status)` in `app.js`; banner element ids `cloudBanner`, `cloudBannerText`, `cloudBannerReload`.

- [ ] **Step 1: Load storage.js before app.js**

In `public/index.html`, replace:

```html
<script src="app.js"></script>
```

with:

```html
<script src="storage.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 2: Add the banner markup under the header**

In `public/index.html`, replace:

```html
    <button class="header-gear" onclick="openSettings()">⚙️</button>
  </div>
</div>
```

with:

```html
    <button class="header-gear" onclick="openSettings()">⚙️</button>
  </div>
</div>
<div class="cloud-banner" id="cloudBanner">
  <span id="cloudBannerText"></span>
  <button id="cloudBannerReload" onclick="location.reload()">Reload</button>
</div>
```

- [ ] **Step 3: Add the banner styles**

Append to `public/styles.css`:

```css

/* ── CLOUD BANNER ── */
.cloud-banner { display: none; align-items: center; justify-content: center; gap: 12px; padding: 8px 16px; font-size: 13px; font-weight: 600; }
.cloud-banner.unsaved, .cloud-banner.offline { display: flex; background: #fff4e5; color: #8a5a00; border-bottom: 1px solid #f5d9a8; }
.cloud-banner.disconnected { display: flex; background: #ffe5e5; color: #a11; border-bottom: 1px solid #f5b5b5; }
.cloud-banner button { padding: 5px 12px; font-size: 13px; font-weight: 700; border: none; border-radius: 8px; background: #ff3b30; color: #fff; cursor: pointer; }
```

- [ ] **Step 4: Rewire loadData, saveData, and init**

In `public/app.js`, replace this block (it is the `PERSISTENCE` section followed by the first line of the `RENDER` section):

```js
function loadData() {
  const raw = localStorage.getItem('household-expenses-v1');
  if (raw) {
    data = JSON.parse(raw);
  } else {
    data = { payments:{}, otherExpenses:[], billOverrides:{}, customBills:{}, customTabs:[], settings:{} };
    Object.entries(SEED_PAYMENTS).forEach(([id, list]) => {
      data.payments[id] = list.map((p,i) => ({...p, id: id+'_'+i}));
    });
    data.otherExpenses = SEED_OTHER.map((e,i) => ({...e, id:'o'+i}));
    saveData();
  }
}
function saveData() { localStorage.setItem('household-expenses-v1', JSON.stringify(data)); }

// ═══════════════════════════════
//  RENDER
// ═══════════════════════════════
function init() { loadData(); renderTabs(); renderContent(); }
```

with:

```js
function loadData() {
  data = CloudStore.loadCached();
  if (!data) {
    data = { payments:{}, otherExpenses:[], billOverrides:{}, customBills:{}, customTabs:[], settings:{} };
    Object.entries(SEED_PAYMENTS).forEach(([id, list]) => {
      data.payments[id] = list.map((p,i) => ({...p, id: id+'_'+i}));
    });
    data.otherExpenses = SEED_OTHER.map((e,i) => ({...e, id:'o'+i}));
    // Not saved here on purpose: CloudStore.start() uploads it only if the cloud is empty.
  }
}
function saveData() { CloudStore.save(data); }

// The cloud copy replaced the local one (newer copy on another device, a conflict, or a restore).
function replaceData(fresh, reason) {
  data = fresh;
  renderTabs(); renderContent();
  if (reason === 'conflict') showToast('Another device changed the data. Your last change was not saved. Please redo it.');
  else if (reason === 'refresh') showToast('Updated from your other device');
}

const CLOUD_BANNER_TEXT = {
  unsaved: 'Not saved to cloud yet. Will retry.',
  offline: "Can't reach the cloud. Showing your last saved copy.",
  disconnected: 'Signed out. Reload to sign in again.',
};
function updateCloudBanner(status) {
  const banner = document.getElementById('cloudBanner');
  banner.className = 'cloud-banner' + (status === 'saved' ? '' : ' ' + status);
  document.getElementById('cloudBannerText').textContent = CLOUD_BANNER_TEXT[status] || '';
  document.getElementById('cloudBannerReload').style.display = status === 'disconnected' ? '' : 'none';
}

// ═══════════════════════════════
//  RENDER
// ═══════════════════════════════
async function init() {
  loadData(); renderTabs(); renderContent();
  CloudStore.onReplace(replaceData);
  CloudStore.onStatus(updateCloudBanner);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') CloudStore.refresh(); else CloudStore.flush();
  });
  window.addEventListener('online', () => CloudStore.refresh());
  window.addEventListener('pagehide', () => CloudStore.flush());
  await CloudStore.start(data);
}
```

Check that nothing else in `app.js` touches `localStorage`:

```bash
grep -n localStorage public/app.js
```

Expected: no output.

- [ ] **Step 5: Run the automated suites to confirm nothing regressed**

Run: `npm test`

Expected: both suites pass (16 and 16).

- [ ] **Step 6: Run the app locally against local D1 and verify in the browser**

```bash
cp .dev.vars.example .dev.vars
npm run migrate:local
npm run dev
```

Open `http://localhost:8787/` and verify each point:

1. The app renders and no banner is visible. The console shows no errors.
2. Add a payment to any bill. About one second later, `curl -s http://localhost:8787/api/doc | head -c 200` prints `{"version":1,"data":{...` with that payment inside, and `updatedBy` is `you@example.com`.
3. Reload the page. The payment is still there.
4. In the console run `localStorage.clear(); location.reload()`. The payment comes back from the cloud (the fresh-device path) and a toast says "Updated from your other device".
5. Open a second tab on the same URL. Add a payment in the first tab, then click into the second tab. The second tab shows the new payment and the same toast.
6. Stop `wrangler dev`, add a payment in a tab. The amber banner "Not saved to cloud yet. Will retry." appears. Start `wrangler dev` again and click into the tab. The banner disappears and `curl -s http://localhost:8787/api/doc` includes the new payment.
7. Edit `.dev.vars` to an empty `DEV_EMAIL=` (the Worker then answers 401), restart `wrangler dev`, reload the tab. The red banner "Signed out. Reload to sign in again." appears with a Reload button. Restore `.dev.vars` afterwards.

- [ ] **Step 7: Commit**

```bash
git add public/app.js public/index.html public/styles.css
git commit -m "Save through CloudStore and show cloud status banner"
```

---

### Task 6: Settings cloud section with previous versions and restore

**Files:**
- Modify: `public/index.html` (settings markup), `public/styles.css` (version list styles), `public/app.js` (`openSettings`, new `showVersions`, `restoreVersion`, `fmtCloudTime`, `escapeHtml`)

**Interfaces:**
- Consumes: `CloudStore.meta()`, `CloudStore.listSnapshots()`, `CloudStore.restoreSnapshot(id)` from Task 4; `replaceData` from Task 5 re-renders after a restore.
- Produces: globals `showVersions()`, `restoreVersion(id, version)`; element ids `cloudSavedAt`, `versionsList`.

- [ ] **Step 1: Add the Cloud section at the top of Settings**

In `public/index.html`, replace:

```html
  <div style="padding:14px 0 0">
    <div class="settings-section">
      <div class="settings-row">
        <label>Google Sheets Sync URL</label>
```

with:

```html
  <div style="padding:14px 0 0">
    <div class="settings-section">
      <div class="settings-row">
        <label>Cloud</label>
        <p id="cloudSavedAt">Last saved to cloud: never</p>
        <button class="settings-save-btn" style="margin:10px 0 0;width:100%" onclick="showVersions()">Previous versions</button>
        <div id="versionsList"></div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-row">
        <label>Google Sheets Sync URL</label>
```

- [ ] **Step 2: Add the version list styles**

Append to `public/styles.css`:

```css

/* ── PREVIOUS VERSIONS ── */
.version-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid #f2f2f7; font-size: 14px; color: #1c1c1e; }
.version-row span { display: block; font-size: 12px; color: #8e8e93; }
.version-row button { flex-shrink: 0; padding: 6px 12px; font-size: 13px; font-weight: 700; border: none; border-radius: 8px; background: #007aff; color: #fff; cursor: pointer; }
#versionsList { margin-top: 10px; }
#versionsList p { font-size: 13px; color: #8e8e93; }
```

- [ ] **Step 3: Show the last save time and add the versions functions**

In `public/app.js`, replace:

```js
function openSettings() {
  document.getElementById('sheetsUrl').value = (data.settings||{}).sheetsUrl||'';
  document.getElementById('settingsOverlay').classList.add('open');
}
```

with:

```js
function openSettings() {
  document.getElementById('sheetsUrl').value = (data.settings||{}).sheetsUrl||'';
  document.getElementById('cloudSavedAt').textContent = 'Last saved to cloud: ' + fmtCloudTime(CloudStore.meta().savedAt);
  document.getElementById('versionsList').innerHTML = '';
  document.getElementById('settingsOverlay').classList.add('open');
}

function fmtCloudTime(iso) {
  if (!iso) return 'never';
  const d = new Date(iso);
  return isNaN(d) ? 'never' : d.toLocaleString();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

async function showVersions() {
  const list = document.getElementById('versionsList');
  list.innerHTML = '<p>Loading...</p>';
  let snaps;
  try {
    snaps = await CloudStore.listSnapshots();
  } catch (e) {
    list.innerHTML = '<p>Could not load versions. Check your connection.</p>';
    return;
  }
  if (!snaps.length) { list.innerHTML = '<p>No previous versions yet.</p>'; return; }
  list.innerHTML = snaps.map(s =>
    `<div class="version-row">
      <div><strong>Version ${s.version}</strong> · ${escapeHtml(fmtCloudTime(s.createdAt))}<span>${escapeHtml(s.updatedBy)}</span></div>
      <button onclick="restoreVersion(${s.id}, ${s.version})">Restore</button>
    </div>`).join('');
}

async function restoreVersion(id, version) {
  if (!confirm('Restore version ' + version + '? Your current data is kept as a new version, so this can be undone.')) return;
  try {
    await CloudStore.restoreSnapshot(id);
  } catch (e) {
    showToast('Restore failed. Check your connection.');
    return;
  }
  closeSettings();
  showToast('Restored version ' + version + '.');
}
```

- [ ] **Step 4: Verify in the browser**

With `npm run dev` running (see Task 5 step 6), open `http://localhost:8787/`:

1. Make three separate edits (for example add a payment, edit its amount, add another payment) so there are several versions.
2. Open Settings. "Last saved to cloud" shows a recent local time.
3. Press "Previous versions". A list appears, newest first, each row showing the version number, the time, the email `you@example.com`, and a Restore button.
4. Restore the oldest listed version and confirm the dialog. Settings closes, the toast says "Restored version 1." and the content shows the data as it was at that version.
5. Open Settings again and press "Previous versions". The list now has one more entry at the top, whose version number is one higher than the previous top, because the restore itself was saved as a new version.
6. Stop `wrangler dev` and press "Previous versions". The list shows "Could not load versions. Check your connection." Start it again.

- [ ] **Step 5: Run the automated suites**

Run: `npm test`

Expected: both suites still pass.

- [ ] **Step 6: Commit**

```bash
git add public/app.js public/index.html public/styles.css
git commit -m "Add previous versions list and restore to Settings"
```

---

### Task 7: README, dry-run deploy check, and final test run

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the operator and maintainer documentation.

- [ ] **Step 1: Write README.md**

```markdown
# Household Expenses

A small web app for tracking household bills and expenses. The page is plain HTML, CSS, and JavaScript with no build step. Data lives in a Cloudflare D1 database behind a Cloudflare Worker, and Cloudflare Access handles sign-in with a one-time code sent by email.

## Who edits what

- `public/` is the app. Edit `index.html`, `styles.css`, and `app.js` freely. `storage.js` is the bridge to the cloud and rarely needs changes.
- Everything else (the Worker in `src/`, `migrations/`, `wrangler.jsonc`, tests) is the operator's.

Pushing to the `main` branch deploys automatically once Workers Builds is connected (see Setup, step 6).

## How data is stored

- The whole household is one JSON document in the `document` table, saved on every change with a version number. A save from a device holding an old version is refused and the device reloads the newer copy.
- Every save also writes a copy to the `snapshot` table (the newest 100 are kept). Settings, Previous versions lists them and restores any of them. A restore is saved as a new version, so it can be undone too.
- D1 keeps 7 days of point-in-time restore on the free plan as a last resort: `npx wrangler d1 time-travel restore household-expenses --timestamp <ISO time>`.
- The browser keeps a local copy so the app opens instantly and still shows data offline.

## Setup (operator, once)

1. Install and sign in: `npm install`, then `npx wrangler login`.
2. Create the database: `npx wrangler d1 create household-expenses`. Copy the `database_id` from the output into `wrangler.jsonc`, replacing the zeros.
3. Deploy: `npm run deploy`. This applies the migration to the remote database and publishes the Worker at `https://household-expenses.<your-subdomain>.workers.dev`.
4. Turn on sign-in: in the Cloudflare dashboard open Workers & Pages, pick `household-expenses`, open Settings, and enable Cloudflare Access for all hostnames. The first time, Cloudflare asks you to choose a Zero Trust team name.
5. Set who may sign in: in the Zero Trust dashboard open Access, Applications, and edit the application Cloudflare created for the Worker. Its policy should Allow only the specific emails of the people who use the app. Under login methods keep only One-time PIN. Set the session duration to the longest available so people are not asked for a code often.
6. Optional, automatic deploys: in the Worker's Settings open Builds and connect this GitHub repository. Build command `npm ci`, deploy command `npm run deploy`, branch `main`. If the build cannot apply migrations because of permissions, run `npm run migrate` from your machine after schema changes and set the deploy command to `npx wrangler deploy`.
7. Open the URL on each device, enter the email, enter the emailed code. Add it to the home screen on the phone.

Until Access is enabled, the API refuses every request with 401, so the app shows "Signed out" and saves nothing. That is intended.

## Moving existing data from the old single-file version

1. In the old page open Settings, press Export, and copy the text.
2. In the new app sign in, open Settings, paste into the Backup / Transfer box, press Import, and confirm.
3. The import is saved to the cloud. Other devices pick it up when they next open the app.

## Local development

```bash
cp .dev.vars.example .dev.vars   # the email the Worker treats as signed in locally
npm run migrate:local             # create the tables in the local database
npm run dev                       # http://localhost:8787
```

## Tests

```bash
npm test               # both suites
npm run test:worker    # Worker against a local D1
npm run test:storage   # storage adapter under jsdom
```

## Backups and handover

- Manual export of the whole database: `npx wrangler d1 export household-expenses --remote --output backup.sql`.
- To hand the app to another operator: they clone this repository and follow Setup in their own Cloudflare account, then move the data with Export and Import in Settings or by importing `backup.sql` with `npx wrangler d1 execute household-expenses --remote --file backup.sql`.
- To add or remove a person: edit the emails in the Access policy. No code change.
```

- [ ] **Step 2: Validate the deploy bundle without deploying**

Run:

```bash
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

Expected: output ends with `--dry-run: exiting now.` and reports the assets directory and the D1 binding. No login is required for a dry run. If it prints a warning about the placeholder database id, that is fine until Task 8.

- [ ] **Step 3: Run the full suite one more time**

Run: `npm test`

Expected: `16 passed` for the Worker files and `16 passed` for the adapter.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Document setup, local development, tests, and handover"
```

---

### Task 8: Operator setup on Cloudflare and data migration (manual, needs the operator's account)

**Files:**
- Modify: `wrangler.jsonc` (real `database_id`)

**Interfaces:**
- Consumes: the deployed Worker and the README steps.
- Produces: the live app URL behind Access, the real database, the mother's data in the cloud.

This task cannot be done by an agent without the operator's Cloudflare login. Run it from the operator's machine.

- [ ] **Step 1: Sign in and create the database**

```bash
npx wrangler login
npx wrangler d1 create household-expenses
```

Copy the `database_id` from the output into `wrangler.jsonc`, replacing `00000000-0000-0000-0000-000000000000`.

- [ ] **Step 2: Deploy**

```bash
npm run deploy
```

Expected: migrations apply to the remote database, then the Worker publishes and prints its `workers.dev` URL.

- [ ] **Step 3: Confirm the API refuses requests before Access is enabled**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://household-expenses.<your-subdomain>.workers.dev/api/doc
```

Expected: `401`.

- [ ] **Step 4: Enable Access on the Worker and set the policy**

Follow README Setup steps 4 and 5: enable Access for all hostnames on the Worker, then in Zero Trust edit the application's policy to Allow the specific emails, keep only One-time PIN as the login method, and set the longest session duration. Zero Trust onboarding may ask for a payment method even though the free plan is not charged; choose the Free plan.

- [ ] **Step 5: Verify sign-in and saving end to end**

1. `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://household-expenses.<your-subdomain>.workers.dev/` prints `302` and a URL on `cloudflareaccess.com`.
2. In a browser open the app URL. The Access page asks for an email, then for the emailed code, then the app loads.
3. Add a payment. Then run `npx wrangler d1 execute household-expenses --remote --command "SELECT version, updated_by FROM document"` and confirm one row with your email.
4. Open the URL on a second device or browser, sign in, and confirm the same data appears.

- [ ] **Step 6: Move the existing data**

Follow README "Moving existing data from the old single-file version" on the mother's current device, then reload the app on the other device and confirm the data matches.

- [ ] **Step 7: Optional automatic deploys**

Follow README Setup step 6 to connect the repository to Workers Builds, then push a trivial change to `main` and confirm a new deployment appears in the dashboard.

- [ ] **Step 8: Commit the real database id**

```bash
git add wrangler.jsonc
git commit -m "Point wrangler at the production D1 database"
```
