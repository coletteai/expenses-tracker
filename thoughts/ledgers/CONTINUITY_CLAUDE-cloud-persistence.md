# Continuity Ledger: cloud-persistence

## Goal
Move the single-file household expenses tracker (coletteai/expenses-tracker) to a Cloudflare Worker with a D1 database and Cloudflare Access login, so the friend's mother can use it from phone and laptop without ever losing data. Done means: the plan's eight tasks are complete, both test suites pass, the app runs behind Access on workers.dev, and the mother's existing data has been imported.

## Constraints
- No framework, no build step. `public/` stays plain HTML, CSS, and classic scripts. The UI maintainer (the friend) edits only `public/`.
- JSON document shape and the cache key `household-expenses-v1` unchanged. One household per deployment.
- Free tier only, nothing that pauses on inactivity. Cloudflare Workers + D1 + Access.
- `compatibility_date` 2026-08-22 (newest supported by the local runtime in wrangler 4.132). vitest 4 (the Cloudflare pool 0.22 does not support vitest 5).
- Commits appear user-authored: no Claude attribution trailers. Never commit `.dev.vars`.
- No em dashes in any new text.

## Key Decisions
- Cloudflare over Supabase (pauses after 7 idle days), Turso (archives after 10 idle days), Firebase (weaker free backups, 1 MB doc limit), PocketBase (ties the app to a personal server). InstantDB is sunsetting.
- Store one JSON document per household plus a snapshot table (last 100 saves) instead of normalizing. Restore writes a new version so it is undoable.
- Two-step write in the Worker: update alone, check changed rows, then batch snapshot and prune. A single batch keyed on the new version misfires when the client is exactly one version behind.
- Login is Cloudflare Access bound to the Worker with one-time email PIN. The Worker reads identity via `ctx.access.getIdentity()`, with `DEV_EMAIL` only for local dev and tests.
- Storage adapter `CloudStore` owns cache, meta, debounce, conflicts, and startup decision; `app.js` only calls `loadCached`, `save`, `start`, `refresh`, `flush`, and listens to `onReplace` and `onStatus`.
- Existing data moves by Export in the old page and Import in the new one (different origin, so localStorage cannot carry over).

## State
- Done:
  - [x] Design brainstormed and approved; spec at docs/superpowers/specs/2026-09-16-cloudflare-d1-persistence-design.md
  - [x] Toolchain, Worker, and adapter prototyped in the session scratchpad; 32 tests passing there
  - [x] Plan written at docs/superpowers/plans/2026-09-16-cloudflare-d1-persistence.md
- Now: [→] Task 8 in progress on 2026-09-22: new Cloudflare account (Coletteai17@gmail.com, id b21fea6b4e5cff354d5d7e5e48273838, subdomain coletteai17.workers.dev). Auth via account API token in the git-ignored .env (wrangler OAuth callback never reached a listener on this Mac). D1 household-expenses created (3a21e1ef-fbc9-4ee6-99f8-c0e93b8b213f), migration applied, Worker deployed at https://household-expenses.coletteai17.workers.dev (API answers 401 as designed). Remaining: enable Access on the Worker + policy in the dashboard (Kaio), verify 302 to cloudflareaccess.com, sign in and check updated_by, export/import the mother's data, commit wrangler.jsonc (account_id + database_id) via the commit skill, push main.
- Remaining (plan tasks):
  - [x] Task 1: Project scaffold and database schema (68b2ca3)
  - [x] Task 2: Split index.html into public/ files (9ddfb61)
  - [x] Task 3: Worker API with tests (7817176)
  - [x] Task 4: Storage adapter with tests (8d4329a, fixes abde2a9 and da2d478)
  - [x] Task 5: Wire the app to CloudStore and add the status banner (05f37ad)
  - [x] Task 6: Settings cloud section with previous versions and restore (d8cbf53)
  - [x] Task 7: README, dry-run deploy check, final test run (3b91e2c)
  - [ ] Task 8: Operator setup on Cloudflare and data migration (manual, needs Kaio's account; README has the steps)

## Open Questions
- UNCONFIRMED: exact shape of `ctx.access.getIdentity()` in production (verified only by tests with a stub; Task 8 step 5 confirms it live).
- UNCONFIRMED: longest Access session duration available in the dashboard.
- UNCONFIRMED: whether Workers Builds can apply D1 migrations with its default token (README has the fallback).

## Working Set
- Repo: /Users/hikaio/Documents/apps/colette-expenses-tracker (branch `main` at 28dff06; `cloud-persistence` merged and deleted)
- Spec and plan: docs/superpowers/specs/, docs/superpowers/plans/ (uncommitted until the user asks)
- Spike with verified code: /private/tmp/claude-501/-Users-hikaio-Documents-apps-colette-expenses-tracker/8ea7c48a-b7f0-46ba-ab54-b3ce59e033f1/scratchpad/spike (session-scoped, may vanish)
- Test commands after Task 1: `npm test`, `npm run test:worker`, `npm run test:storage`
- Local run after Task 5: `cp .dev.vars.example .dev.vars && npm run migrate:local && npm run dev`
Passphrase sign-in: implementer commit 02c34f7; review pending
Passphrase sign-in review (opus): sound, fails closed on every probed path. Ruling: Important 2 (delay does not throttle parallel guessing, brief-mandated) accepted as a design limit; spec and README wording corrected; rate-limiting rule noted as the upgrade. ⚠️ extra files in the commit (account_id, database_id, .gitignore .env, spec section 8) were authorized by the controller. Deferred minors: logout has no Origin check (nuisance only); only the first session cookie is read; /login.html test asserts 200 while production answers 307; cookie attribute tests use toContain; no test for a missing SESSION_SECRET; login name field lacks maxlength. Fix round 1 sent: flaky tamper test, stale README step.
2026-09-22: passphrase sign-in shipped (02c34f7 + fix 81e842e, re-review clean). Secrets set on the Worker: SESSION_SECRET (generated, never shown) and a TEMPORARY HOUSEHOLD_PASSPHRASE that Kaio must replace with `npx wrangler secret put HOUSEHOLD_PASSPHRASE`. Deployed 687f1883; production checks: / -> 302 /login, /login 200, /api/doc 401, wrong passphrase 401, right 200 + cookie, browser sign-in as "Kaio" worked and the seed document uploaded. Remaining: Kaio sets his own passphrase, commits the spec wording + ledger via the commit skill, pushes main; the friend exports/imports the mother's data.
