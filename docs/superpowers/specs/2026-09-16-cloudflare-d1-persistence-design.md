# Household Expenses Tracker: Cloud Persistence on Cloudflare

Date: 2026-09-16
Status: Draft for review
Repository: coletteai/expenses-tracker

## 1. Goal

Turn the single-file expenses tracker into a small web app whose data lives in the cloud, so the owner's mother can use it from her phone and her laptop and never lose data when a browser is cleared or a device is replaced.

Success looks like:

- The same data appears on every device after signing in once per device.
- No data is lost if a device is wiped, a browser cache is cleared, or a save fails while offline.
- A bad edit or a bad import can be undone by restoring a previous version from inside the app.
- Nothing pauses or expires when the app goes unused for weeks.
- The friend who maintains the UI keeps editing plain HTML, CSS, and JS files and never needs a terminal.
- Total running cost is zero.

## 2. Non-goals

- Normalizing the data into relational tables.
- A login screen or any authentication code inside the app.
- Offline editing with a service worker. The cached copy is a read-only fallback.
- Several households in one deployment.
- Moving the seed bills and tabs out of the code and into the database.
- Automated off-site backups beyond D1 point-in-time restore and the in-app snapshots.

## 3. Current state

- `index.html` holds styles, markup, seed data, and all logic in one file of about 1700 lines.
- Persistence is one `localStorage` key, `household-expenses-v1`, holding one JSON object with the keys `payments`, `otherExpenses`, `billOverrides`, `customBills`, `customTabs`, `tabOverrides`, `deletedTabs`, `deletedBills`, `tabOrder`, and `settings`.
- `loadData()` reads the key or seeds defaults from constants in the code. `saveData()` writes the key. `saveData()` is called from 18 places, each after a discrete user action, never per keystroke.
- `init()` runs synchronously at the end of the file: load, render tabs, render content.
- Settings offers Export (dumps the JSON into a textarea), Import (overwrites everything), and a one-way Google Sheets sync that posts rows to an Apps Script URL.

## 4. Architecture

```
Browser (phone, laptop)
  public/index.html + app.js + storage.js
        |  same-origin fetch; the Access cookie is sent automatically
        v
Cloudflare Access  (one-time email code, allowlist of emails)
        |
        v
Cloudflare Worker  (serves public/ as static assets, handles /api/*)
        |
        v
D1 (SQLite)        document (one row) + snapshot (last 100 saves)
```

One deployment is one household. Everyone allowed by the Access policy sees the same data. A second household is a second deployment of the same code with its own database and its own policy.

## 5. Repository layout

```
public/
  index.html
  styles.css
  app.js
  storage.js
  manifest.json
  icons/icon-512.png
  icons/apple-touch-icon.png
src/
  worker.js
migrations/
  0001_init.sql
test/
  worker.test.js
  storage.test.js
wrangler.jsonc
package.json
vitest.config.js
.dev.vars.example
README.md
```

- `public/` is the only folder the UI maintainer touches.
- `styles.css` is today's style block moved verbatim.
- `app.js` is today's script block moved verbatim, except for `loadData`, `saveData`, `init`, and the new Settings section described in section 10.
- Scripts stay classic scripts, not ES modules, because the markup uses inline `onclick` handlers that reference global functions. `storage.js` loads before `app.js` and exposes one global, `CloudStore`.
- `manifest.json` and the icons exist so "Add to Home Screen" shows a name and an icon. Any simple 512 by 512 PNG plus a 180 by 180 Apple touch icon is enough.

## 6. Data model

### 6.1 The document

The JSON keeps exactly today's shape. The Worker never inspects its contents beyond checking that it is a JSON object.

### 6.2 Schema

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

- `version` starts at 1 and increases by 1 on every successful save.
- Timestamps are ISO 8601 UTC strings set by the Worker.
- `updated_by` is the signed-in email.
- `snapshot` receives a copy of the document after every successful save, including the first save and every restore, and is pruned to the newest 100 rows in the same batch.

### 6.3 Size expectations

Today's document is tens of kilobytes. Ten years of payments stays well under 1 MB. The Worker rejects bodies over 5 MB as a sanity limit. The D1 free plan allows 500 MB per database.

## 7. API

All endpoints live under `/api/`, respond with JSON, and require an authenticated identity (section 8). Unknown `/api/*` paths return 404.

### GET /api/doc

- 200 `{ "version": 12, "data": { ... }, "updatedAt": "...", "updatedBy": "..." }`
- 404 `{ "error": "empty" }` when no document exists yet.

### PUT /api/doc

Body: `{ "baseVersion": 12 | null, "data": { ... } }`

- `baseVersion: null` means "I believe no document exists". If none exists, insert version 1.
- If a document exists and `baseVersion` equals its version, update it to version + 1.
- Otherwise respond 409 `{ "error": "conflict", "version": ..., "data": { ... }, "updatedAt": "...", "updatedBy": "..." }` carrying the current server copy.
- 200 `{ "version": 13, "updatedAt": "..." }` on success.
- 400 when `data` is not a JSON object or `baseVersion` is neither an integer nor null.
- 413 when the body exceeds 5 MB.

Write order: the update (or the first insert, done with `INSERT OR IGNORE`) runs alone and reports its changed-row count. Zero changed rows means the base was stale: the Worker reads the current row and answers 409. Exactly one changed row means the write happened, and only then does one `DB.batch()` copy the document row into `snapshot` and prune the table. A refused write therefore never produces a snapshot. Keying the snapshot insert on the new version number in a single batch was considered and rejected, because it fires wrongly when the client is exactly one version behind, which is the most common stale case. One more rule: a non-null `baseVersion` against an empty table is treated as the first version rather than refused, so a reset database never locks a client out.

### GET /api/snapshots

- 200 `{ "snapshots": [ { "id": 41, "version": 12, "createdAt": "...", "updatedBy": "...", "bytes": 48213 } ] }`, newest first, at most 100 entries, without the data payload.

### POST /api/snapshots/:id/restore

- Copies the snapshot's data into the document as a new version (current version + 1), records a snapshot of that restored state, and returns 200 `{ "version": ..., "data": { ... }, "updatedAt": "..." }`.
- Restore ignores `baseVersion` on purpose. It is an explicit user action that must win. The client replaces its local copy with the response.
- 404 when the snapshot id does not exist.

## 8. Authentication and identity

- Cloudflare Access is enabled on the Worker itself, for all hostnames, so the static app and the API are protected together on the workers.dev address. No custom domain is needed.
- Policy: Allow, including a list of specific emails: the mother, the UI maintainer, and the operator.
- Login method: one-time PIN by email only. Session duration: the longest option Cloudflare offers.
- The browser sends the Access cookie automatically because the API is same-origin. The app has no login UI and no token handling.
- The Worker resolves the identity email in this order:
  1. `ctx.access.getIdentity()`, available when Access is bound to the Worker.
  2. `env.DEV_EMAIL`, set only in a local `.dev.vars` file for `wrangler dev` and in test bindings. It is never set in production.
  3. Otherwise respond 401 `{ "error": "unauthenticated" }`.
- Adding a family member means adding one email to the policy. Removing access means removing it.

## 9. Frontend: the storage adapter

`public/storage.js` defines `CloudStore`, the only code that knows about `localStorage` and `/api/`.

### 9.1 State

- Cache key `household-expenses-v1`, unchanged, holds the JSON document.
- Meta key `household-expenses-v1.meta` holds `{ "version": <last known server version or null>, "dirty": true | false, "savedAt": "<ISO time of last successful cloud save or null>" }`.
- In memory: the debounce timer, an in-flight flag, a pending-flush flag, and a per-save sequence number that tells a finished PUT whether the cache changed while it ran (a PUT clears `dirty` only when no save happened during it; otherwise a follow-up is sent).

### 9.2 Public surface

- `CloudStore.loadCached()` returns the cached document or null.
- Internally, `fetchRemote()` resolves to `{ version, data, updatedAt, updatedBy }`, or null on 404, rejects with `AuthError` on 401, 403, or an opaque redirect (expired Access session), and with `NetworkError` on a fetch failure. It is not part of the public surface; `start()` and `refresh()` use it.
- `CloudStore.save(data)` writes the cache, sets `dirty`, and schedules a PUT 1000 ms after the most recent call. If a PUT is in flight, one more runs after it finishes with the latest data.
- `CloudStore.flush()` sends any pending save immediately with `keepalive: true`. Called on `pagehide` and when the page becomes hidden. If a save is already in flight, flush waits for it and then sends the follow-up at once with `keepalive: true`, and its promise resolves after that follow-up. Browsers cap keepalive requests at 64 KB, so a very large document may not flush in time; the dirty cache guarantees it is saved on the next open.
- `CloudStore.start(localData)` runs the startup decision from 9.4 step 3 and returns when it is settled.
- `CloudStore.refresh()` fetches the remote copy. If the cache is not dirty, before and after the fetch, and the remote version is newer than the known version, it replaces the cache and notifies. If the cache is dirty at either point, it triggers a save instead, which either succeeds or conflicts. A save never sends when nothing is dirty.
- `CloudStore.listSnapshots()` and `CloudStore.restoreSnapshot(id)` wrap the two snapshot endpoints. Restore replaces the cache with the returned document and notifies.
- `CloudStore.onReplace(fn)` registers a callback that receives the new document and a reason, one of `refresh`, `conflict`, or `restore`, whenever the server copy replaces the local one.
- `CloudStore.onStatus(fn)` registers a callback that receives one of `saved`, `unsaved`, `offline`, or `disconnected`, plus the last cloud save time.

### 9.3 Requests

- All requests use `credentials: 'same-origin'`, `redirect: 'manual'`, and `Accept: application/json`.
- A response with `type === 'opaqueredirect'`, or with status 401 or 403, means the Access session expired.

### 9.4 Changes in `app.js`

- `loadData()`: `data = CloudStore.loadCached()`. If null, seed defaults exactly as today, but do not save yet.
- `saveData()`: `CloudStore.save(data)`. All 18 call sites stay untouched.
- `init()` becomes async:
  1. `loadData()`, `renderTabs()`, `renderContent()` immediately, from the cache or the seed.
  2. Register `onReplace` (replace `data`, re-render, toast) and `onStatus` (drive the banner).
  3. `await CloudStore.start(data)`, which decides:
     - Remote exists, and either the cache was null or the remote version is newer than the known version, and the cache is not dirty: adopt the remote and fire `onReplace` with reason `refresh`, so the app replaces `data` and re-renders.
     - Remote exists and the cache is dirty: save now with the known base version. A stale base produces a conflict, handled in 9.5.
     - Remote is null: save now with `baseVersion: null`. This uploads either the cached data or the fresh seed.
  4. Listen for `visibilitychange` to visible, `focus`, and `online` to call `CloudStore.refresh()`. Listen for `pagehide` and `visibilitychange` to hidden to call `CloudStore.flush()`. Before re-rendering after a replace, fall back to the first tab if the active tab no longer exists in the new data.

### 9.5 Conflict handling

On 409 the adapter replaces the cache with the server copy, sets `dirty` to false, records the server version, and fires `onReplace`. The app re-renders and shows the toast "Another device changed the data. Your last change was not saved. Please redo it."

This is expected to be rare because the app refreshes whenever it regains focus or comes back online, so a device normally holds the latest version before the user edits.

### 9.6 Failure handling

| Situation | Behavior |
|---|---|
| Save fails with a network error | Keep `dirty` true, status `unsaved`, banner "Not saved to cloud yet. Will retry." Retry on `online`, on focus, and on the next save. |
| Save fails with an expired session | Status `disconnected`, banner "Signed out. Reload to sign in again." with a Reload button. Data stays in the cache with `dirty` true, so it is saved after the next sign-in. |
| Initial load fails with a network error | Render the cache, status `offline`, banner "Can't reach the cloud. Showing your last saved copy." Refresh on `online` or focus. |
| Initial load fails with an expired session | Render the cache, status `disconnected`, same Reload banner. |
| No cache and the load fails | Render the seed with the `offline` or `disconnected` banner as above. Any later save carries `baseVersion: null`, so it cannot overwrite an existing cloud document. A conflict simply pulls the cloud copy in. |

### 9.7 Banner

A slim status bar under the header, hidden when the status is `saved`. Three visible states: `unsaved`, in amber, "Not saved to cloud yet. Will retry."; `offline`, in amber, "Can't reach the cloud. Showing your last saved copy."; and `disconnected`, in red, "Signed out. Reload to sign in again." with a Reload button. No saving spinner.

## 10. Settings screen changes

- Add a "Cloud" section showing "Last saved to cloud" with the time, and a "Previous versions" button. The button lists snapshots with date, time, saved by, and version, each with a Restore button. Restore asks for confirmation, calls the restore endpoint, re-renders, and toasts "Restored version N."
- Keep Export, Import, and the Google Sheets sync exactly as they are. Import still overwrites everything and is followed by a normal save, so it is itself undoable through snapshots.

## 11. Migrating the mother's existing data

The new app runs on a new origin, so it cannot read the old page's `localStorage`. One-time procedure, done by the UI maintainer:

1. Open the old page on the mother's device, open Settings, press Export, copy the JSON.
2. Open the new app, sign in, open Settings, paste into the box, press Import, confirm.
3. The import saves to the cloud. Other devices pick it up on their next open.

## 12. Deployment and configuration

### 12.1 wrangler.jsonc

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
      "database_id": "filled in during one-time setup",
      "migrations_dir": "migrations"
    }
  ],
  "observability": { "enabled": true }
}
```

### 12.2 package.json scripts

- `dev`: `wrangler dev`, using a local D1 and `DEV_EMAIL` from `.dev.vars`.
- `migrate`: `wrangler d1 migrations apply household-expenses --remote`.
- `deploy`: `npm run migrate && wrangler deploy`.
- `test`: `vitest run`.

Dev dependencies: `wrangler`, `vitest`, `@cloudflare/vitest-pool-workers`, `jsdom`. No runtime dependencies.

### 12.3 One-time setup by the operator

1. `npx wrangler login`, then `npx wrangler d1 create household-expenses`, and paste the database id into `wrangler.jsonc`.
2. `npm run deploy`, which applies the migration and publishes the Worker.
3. Cloudflare dashboard, Workers, this Worker, Settings: enable Access for all hostnames.
4. Zero Trust dashboard, Access, Applications, the generated application: policy Allow with the email list; login methods: one-time PIN only; session duration: the longest available.
5. Optional: Workers Builds, connect the GitHub repository with deploy command `npm run deploy`, so pushes to the main branch deploy automatically and the UI maintainer never needs a terminal.
6. Send the mother the workers.dev link. She adds it to her home screen.

### 12.4 Handover

The README documents the six steps above. A new operator repeats them in their own Cloudflare account and moves the data either with `wrangler d1 export` and import, or with the in-app Export and Import.

## 13. Testing

### 13.1 Worker

`test/worker.test.js`, vitest with `@cloudflare/vitest-pool-workers`, migrations applied in setup, `DEV_EMAIL` bound.

- GET on an empty database returns 404.
- PUT with `baseVersion: null` on an empty database creates version 1 and one snapshot.
- PUT with the matching base version increments the version, updates `updated_by`, and adds a snapshot.
- PUT with a stale base version returns 409 with the current document and inserts no snapshot.
- PUT with `baseVersion: null` when a document exists returns 409.
- PUT rejects non-object data with 400 and oversized bodies with 413.
- Snapshots are pruned to 100.
- GET snapshots lists newest first without data.
- Restore writes a new version whose data equals the snapshot and records a snapshot.
- Requests without an identity return 401, and the Access identity is used when the runtime provides one (a second test file runs the Worker without the dev email binding).

### 13.2 Storage adapter

`test/storage.test.js`, vitest with jsdom, fake `fetch` and fake `localStorage`.

- `save` writes the cache immediately and issues one PUT after the debounce, with the latest data, even when called several times.
- Startup with a newer remote replaces the cache and fires `onReplace`.
- Startup with an older or equal remote keeps the cache.
- A dirty cache at startup sends a PUT with the known base version.
- A 409 replaces the cache, clears dirty, and fires `onReplace`.
- A network failure keeps dirty and reports `unsaved`; the next `refresh` or `save` retries.
- An opaque redirect or a 401 reports `disconnected`.
- `flush` sends immediately with `keepalive`.

### 13.3 Manual pass before handover

Two browsers side by side: edit in one, focus the other, see the change. Disable the network, edit, see the banner, re-enable, see it clear. Restore a previous version from Settings. Open on an iPhone, add to the home screen, sign in with a code.

## 14. Operational notes

- Free plan headroom: Workers allows 100,000 requests a day and D1 allows 100,000 writes a day. This app uses a few hundred at most.
- Nothing pauses on inactivity.
- D1 Time Travel keeps 7 days of point-in-time restore on the free plan, restorable with `wrangler d1 time-travel restore`.
- The in-app snapshots keep the last 100 saves regardless of age.
- Optional manual off-site backup: `wrangler d1 export household-expenses --remote --output backup.sql`.

## 15. Assumptions to verify during implementation

- The exact shape of `ctx.access.getIdentity()` in the Workers runtime at the chosen compatibility date. If it differs, the identity helper in `worker.js` is the only place to change. The compatibility date is 2026-08-22 because that is the newest date the local test runtime bundled with the current wrangler supports.
- The maximum session duration available in the Access application settings.
- Zero Trust free plan onboarding may ask for a payment method. The plan itself is not charged.

## 16. Future extensions, not in this design

- Several households per deployment: add a `household` table and key documents and snapshots by household id, with membership derived from the Access email.
- Move the seed bills and tabs into the document so the code is fully generic.
- CSV export served by the Worker from the document, replacing the Apps Script sync.
- A service worker for offline editing.
