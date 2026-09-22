# CLAUDE.md

Guidance for anyone (or any Claude session) working on this repository. Read this before changing anything. The README has the longer background; this file is the working checklist.

## What this is

A household expenses tracker used by one family. It is live at `https://household-expenses.coletteai17.workers.dev`, running on a Cloudflare Worker with a D1 (SQLite) database, all on the free plan. Sign-in is a shared household passphrase; each device signs in once and stays signed in for a year.

Nothing here has a build step. The app is plain HTML, CSS, and classic JavaScript files. Do not add a framework, a bundler, TypeScript, or npm runtime dependencies.

## Where things live

| Path | What it is | Edit freely? |
|---|---|---|
| `public/index.html` | The page markup | Yes |
| `public/styles.css` | All styles | Yes |
| `public/app.js` | All app logic: tabs, bills, payments, Settings | Yes |
| `public/login.html` | The sign-in page, self-contained | Yes, keep it self-contained |
| `public/manifest.json`, `public/icons/` | Home-screen name and icon | Yes |
| `public/storage.js` | `CloudStore`: cache, saving, sync, conflicts | Only with care; it has 23 tests |
| `src/worker.js` | The API and sign-in on Cloudflare | Only with care; it has 29 tests |
| `migrations/` | Database schema, one file per change | Add new files, never edit old ones |
| `wrangler.jsonc` | Cloudflare config: account id, database id, assets | Rarely |
| `test/` | Test suites | Update when behavior changes |
| `docs/superpowers/specs/` | The design spec, the authority on how the sync works | Update when the design changes |

Rules that keep the data safe:
- `saveData()` in `app.js` must stay the single way changes are persisted. After changing `data`, call `saveData()`; never write `localStorage` directly.
- The JSON document shape (`payments`, `otherExpenses`, `billOverrides`, `customBills`, `customTabs`, `tabOverrides`, `deletedTabs`, `deletedBills`, `tabOrder`, `settings`) is what every device and every snapshot holds. Add keys if needed; do not rename or repurpose existing ones.
- Never put secrets in code or commit `.env` or `.dev.vars`. Both are git-ignored.

## Running it locally

```bash
npm install                      # once
cp .dev.vars.example .dev.vars   # once; DEV_EMAIL makes localhost skip sign-in
npm run migrate:local            # once, creates the local tables
npm run dev                      # http://localhost:8787
```

Local data lives in `.wrangler/state` and never touches production.

## Testing

```bash
npm test               # both suites, must be green before any deploy
npm run test:worker    # API and sign-in against a local D1 (29 tests)
npm run test:storage   # browser sync adapter under jsdom (23 tests)
```

If you change `src/worker.js` or `public/storage.js`, add or update a test in the matching suite. UI-only changes in `app.js`, `styles.css`, or `index.html` have no unit tests; check them in the browser with `npm run dev`.

## Deploying

Deploys need a Cloudflare API token for the account that owns the Worker (the account whose subdomain is `coletteai17`). Create one in the Cloudflare dashboard under My Profile, API Tokens, template "Edit Cloudflare Workers", plus the permission Account, D1, Edit. Put it in a file named `.env` at the repository root, one line, never in chat and never committed:

```
CLOUDFLARE_API_TOKEN=the-token
```

Then, with tests green:

```bash
npm run deploy    # applies any new migration to production, then publishes
```

The new version is live within seconds at the URL above. Cloudflare keeps previous versions; `npx wrangler rollback` returns to the last one if something is wrong.

Do not deploy with failing tests, and do not deploy a schema change without a new migration file in `migrations/`.

## Sign-in and secrets

Two secrets live on the Worker, never in the repository:
- `HOUSEHOLD_PASSPHRASE`: what people type to sign in. To change it: `npx wrangler secret put HOUSEHOLD_PASSPHRASE` and type a full sentence. Takes effect in seconds; signed-in devices stay signed in.
- `SESSION_SECRET`: signs the cookies. Rotating it signs every device out at once: `openssl rand -base64 32 | npx wrangler secret put SESSION_SECRET`.

Adding a person means sharing the passphrase. Removing one means changing it.

## Data safety

- Every save keeps a snapshot; Settings, "Previous versions" restores any of the last 100. A restore is itself a new version, so it can be undone.
- D1 keeps 7 days of point-in-time restore: `npx wrangler d1 time-travel restore household-expenses --timestamp <ISO time>`.
- Manual backup: `npx wrangler d1 export household-expenses --remote --no-schema --table document --table snapshot --output backup.sql`.
- To look at production data: `npx wrangler d1 execute household-expenses --remote --command "SELECT version, updated_by, updated_at FROM document"`.

## Conventions

- Commit messages in the imperative, no attribution trailers.
- No em dashes in text shown to users or written in docs.
- Keep the visible copy exactly as designed: banner and toast texts are listed in the spec, section 9.
- When unsure whether a change touches sync, conflicts, or sign-in, read the spec first: `docs/superpowers/specs/2026-09-16-cloudflare-d1-persistence-design.md`.
