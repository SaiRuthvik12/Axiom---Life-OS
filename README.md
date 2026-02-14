# Axiom — Life OS

A gamified life-operating system: turn goals into **quests**, track **stats** across life areas, earn **credits**, and spend them in the **store**. Built as a single-page app with a terminal-style UI and optional AI-powered quest suggestions.

## What it does

- **Quests** — Create and complete Daily, Weekly, and Epic quests with XP and credit rewards. Set difficulty (Easy → Extreme), penalties for missing quests, and link quests to stats (physical, cognitive, career, financial, mental, creative).
- **Progression** — Level up, maintain streaks, and unlock level titles (Initiate → Cadet → Operative → Specialist → … → Ascendant → Deity).
- **Stats** — Six life dimensions shown on a radar chart; completing quests boosts the stats you assign.
- **Store** — Spend credits on rewards (e.g. dopamine protocol, cheat meal, hardware upgrade, sabbatical day).
- **Terminal** — System-style log for penalties, resets, and protocol messages.
- **Auth & sync** — Sign up / log in with Supabase; profile and quests sync to the cloud.
- **AI (optional)** — Use Gemini to analyze a quest idea and suggest title, XP, credits, penalty, and stat rewards.

Without Supabase configured, the app runs in **demo mode** with mock quests and no login.

## Tech stack

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS** (via CDN), **Lucide** icons, **Recharts** (stats radar)
- **Supabase** — Auth, PostgreSQL (profiles + quests), Row Level Security
- **Google Gemini** — Optional AI quest analysis
- **PWA** — Installable, works offline, service worker cache

## Run locally

**Prerequisites:** Node.js

1. Clone and install: `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill in your keys.
3. Start dev server: `npm run dev`

### Connecting to Supabase (real data & auth)

Without Supabase, the app uses demo mode (mock quests, no auth). To use your own data:

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Under **Settings → API**, copy **Project URL** and **anon public** key.
3. In `.env.local` set:
   ```bash
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. In the Supabase **SQL Editor**, run the contents of [supabase_schema.sql](supabase_schema.sql) to create `profiles` and `quests` and RLS policies.
5. Restart the dev server. You should see the Auth screen; sign up or log in to use your profile and quests.

Optional: set `GEMINI_API_KEY` in `.env.local` to enable AI quest analysis.

## Deploy

Build: `npm run build` (output in `dist/`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and optionally `GEMINI_API_KEY`) on your host. Ensure all routes serve `index.html` for the SPA.

- **Vercel** — Import from Git, add env vars; build/output are usually auto-detected.
- **Netlify** — Build command: `npm run build`, Publish directory: `dist`, add env vars. The repo includes `public/_redirects` for SPA routing.

## PWA — Install on your phone

After deploying, open the app URL on your phone:

- **Android (Chrome):** Menu → “Install app” or “Add to Home screen.”
- **iOS (Safari):** Share → “Add to Home Screen.”

Open Axiom from the home screen to use it in a standalone window. For a custom app icon on iOS, add `public/icons/icon-192.png` and `public/icons/icon-512.png`; the build includes a default icon.

## Push Notifications

Axiom can send push notifications to your phone (even when the app is closed) for:

- **Quest reminders** — Daily quests at 9 PM, weekly quests on Friday, monthly quests 5 days before month end
- **World events** — District decay, recovery, companion updates, and more
- **Milestones** — When you earn a new milestone
- **Weekly recap** — Sunday evening summary

### Setup

Push notifications require three things: VAPID keys, a database table, and a cron job.

#### 1. Generate VAPID keys

```bash
node scripts/generate-vapid-keys.mjs
```

This outputs a public key and a private key. Save them:

- Add `VITE_VAPID_PUBLIC_KEY=<public_key>` to your `.env.local` (and to your host's env vars)
- The private key goes into Supabase Edge Function secrets (step 3)

#### 2. Create the push_subscriptions table

In the Supabase **SQL Editor**, run the contents of [push_subscriptions_schema.sql](push_subscriptions_schema.sql). This creates the table and RLS policies.

#### 3. Deploy the Edge Function

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you haven't already:

- **macOS:** `brew install supabase/tap/supabase`
- **Or:** add as dev dependency `npm i supabase --save-dev` and use `npx supabase` for all commands below.

Link your project and set secrets:

```bash
cd /path/to/axiom
supabase link --project-ref <your-project-ref>

supabase secrets set VAPID_PRIVATE_KEY=<private_key>
supabase secrets set VAPID_PUBLIC_KEY=<public_key>
supabase secrets set VAPID_SUBJECT=mailto:your@email.com
supabase secrets set CRON_SECRET=<any-random-secret>
```

Deploy the function:

```bash
supabase functions deploy check-reminders --no-verify-jwt
```

> `--no-verify-jwt` is used because the cron service authenticates via the `x-cron-secret` header instead of a JWT.

#### 4. Set up the cron job

The Edge Function needs to be called every hour to check for pending quest reminders. Use any HTTP cron service:

**Option A: [cron-job.org](https://cron-job.org) (free)**

1. Create an account and add a new cron job
2. URL: `https://<project-ref>.supabase.co/functions/v1/check-reminders`
3. Schedule: Every hour (`0 * * * *`)
4. Method: `POST`
5. Headers:
   - `x-cron-secret: <your-cron-secret>`
   - `Authorization: Bearer <your-supabase-anon-key>`

**Option B: GitHub Actions**

Add a workflow file `.github/workflows/cron-reminders.yml`:

```yaml
name: Quest Reminders
on:
  schedule:
    - cron: "0 * * * *"
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://<project-ref>.supabase.co/functions/v1/check-reminders
```

### How it works

- **World events & milestones**: Notifications are shown locally via the service worker when events occur and the app is backgrounded. No server needed.
- **Quest reminders & weekly recap**: The Supabase Edge Function runs every hour, checks each user's timezone, and sends Web Push notifications at the right local time.
- **Permission**: Users are prompted once to enable notifications. They can toggle individual notification types in System Core > Notifications.
