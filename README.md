# Household Expenses

A small web app for tracking household bills and expenses. The page is plain HTML, CSS, and JavaScript with no build step. Data lives in a Cloudflare D1 database behind a Cloudflare Worker, and a shared household passphrase handles sign-in.

## Who edits what

- `public/` is the app. Edit `index.html`, `styles.css`, `app.js`, `manifest.json`, and the icons in `icons/` freely. `storage.js` is the bridge to the cloud and rarely needs changes.
- Everything else (the Worker in `src/`, `migrations/`, `wrangler.jsonc`, tests) is the operator's.

Pushing to the `main` branch deploys automatically once Workers Builds is connected (see Setup, step 6).

## How data is stored

- The whole household is one JSON document in the `document` table, saved on every change with a version number. A save from a device holding an old version is refused and the device reloads the newer copy.
- `updated_by` on the document and each snapshot holds the name typed at sign-in.
- Every save also writes a copy to the `snapshot` table (the newest 100 are kept). Settings, Previous versions lists them and restores any of them. A restore is saved as a new version, so it can be undone too.
- D1 keeps 7 days of point-in-time restore on the free plan as a last resort: `npx wrangler d1 time-travel restore household-expenses --timestamp <ISO time>`.
- The browser keeps a local copy so the app opens instantly and still shows data offline.

## Setup (operator, once)

1. Install and sign in: `npm install`, then `npx wrangler login`.
2. Create the database: `npx wrangler d1 create household-expenses`. Copy the `database_id` from the output into `wrangler.jsonc`, replacing the zeros.
3. Deploy: `npm run deploy`. This applies the migration to the remote database and publishes the Worker at `https://household-expenses.<your-subdomain>.workers.dev`.
4. Set the two secrets: `openssl rand -base64 32 | npx wrangler secret put SESSION_SECRET` and `npx wrangler secret put HOUSEHOLD_PASSPHRASE` (type a sentence-length passphrase when prompted).
5. Open the URL on each device, type a first name and the passphrase once. Add it to the home screen on the phone.
6. Optional, automatic deploys: in the Worker's Settings open Builds and connect this GitHub repository. Build command `npm ci`, deploy command `npm run deploy`, branch `main`. If the build cannot apply migrations because of permissions, run `npm run migrate` from your machine after schema changes and set the deploy command to `npx wrangler deploy`.

The sign-in cookie lasts a year, so this rarely comes up. "Sign out on this device" in Settings ends it early on that device. Changing the passphrase does not sign devices out; rotating `SESSION_SECRET` does, on every device at once. Nothing is lost either way: changes made while signed out stay on the device and upload after the next sign-in.

Until both secrets are set, sign-in answers 503 and the API 401, so the app shows "Signed out" and saves nothing. That is intended.

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

- Manual export of the whole database: `npx wrangler d1 export household-expenses --remote --no-schema --table document --table snapshot --output backup.sql`.
- To hand the app to another operator: they clone this repository and follow Setup in their own Cloudflare account, then move the data with Export and Import in Settings or, on a freshly deployed and still empty database, by importing `backup.sql` with `npx wrangler d1 execute household-expenses --remote --file backup.sql`.
- To add or remove a person: share the passphrase with a new person, or change it and tell everyone. No code change.
