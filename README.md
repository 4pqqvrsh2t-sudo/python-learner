# PyRecall Push

A Duolingo-style Python memory refresher whose **questions arrive as iPhone push notifications**.

## Notification schedule (America/New_York)

**Monday–Friday**
- 7:00 AM
- 9:35 AM
- 12:42 PM
- 3:30 PM
- 9:00 PM

**Saturday–Sunday**
- 12:00 PM
- 2:00 PM
- 4:00 PM
- 6:00 PM
- 8:00 PM

The Worker runs once each minute and checks the `America/New_York` wall clock. This avoids DST shifting the schedule.

## Behavior

- The notification body **is the Python question**, e.g. `What would you write to show the word “Hello”?`
- Tapping it opens that exact question.
- Opening PyRecall manually between scheduled pushes shows **“Eager to learn? How about we challenge you a bit?”** and gives a tier-3 manipulation/writing problem.
- Difficulty is per concept: Recall → Apply → Manipulate as mastery rises.
- `I haven't learned this yet` removes the concept and falls back to harder practice from concepts already marked learned.
- Learned concepts and mastery are synced to the backend so scheduled questions respect your current course progress.

## Why a backend is required

A static GitHub Pages site cannot wake itself while closed and send reliable timed iPhone pushes. PyRecall uses standards-based Web Push plus a scheduled Cloudflare Worker and D1 subscription storage. The Worker enables Cloudflare's `nodejs_compat` flag because the `web-push` package uses Node-compatible crypto APIs.

## Deploy

### 1. Create the Cloudflare project

Install dependencies:

```bash
npm install
```

Create D1:

```bash
npx wrangler d1 create pyrecall-db
```

Copy the returned database ID into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`.

Apply the schema:

```bash
npm run db:init
```

### 2. Generate VAPID keys

```bash
npm run vapid
```

Put the **public** key in `wrangler.jsonc` as `VAPID_PUBLIC_KEY`.

Store the private key and subject as Worker secrets:

```bash
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT
```

For `VAPID_SUBJECT`, use a contact URI such as `mailto:you@example.com`.

### 3. Deploy

```bash
npm run deploy
```

Cloudflare will return the HTTPS URL for the app.

## iPhone setup

On iOS/iPadOS 16.4 or newer:

1. Open the deployed HTTPS site in Safari.
2. Share → **Add to Home Screen**.
3. Open PyRecall from the new Home Screen icon.
4. Tap **Enable daily notifications** and Allow.
5. Tap **Send test notification** to verify delivery.

The PWA must be installed to the Home Screen for iPhone Web Push permission.

## Files

- `src/worker.js` — API + minute scheduler + Web Push delivery
- `src/questions.js` — Python question bank and difficulty tiers
- `migrations/0001_init.sql` — D1 subscriptions/delivery log
- `public/` — installable PWA
- `wrangler.jsonc` — Cloudflare Worker/D1/cron configuration

## Notes

- Expired push subscriptions (HTTP 404/410) are automatically removed.
- A delivery log prevents the same slot from being intentionally sent twice.
- Question selection favors weaker learned concepts.
- The frontend currently assumes one learner per browser/device but the database schema supports multiple subscriptions.
