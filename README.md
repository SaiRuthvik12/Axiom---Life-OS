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
