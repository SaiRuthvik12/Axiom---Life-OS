<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1WKm3YLpxC1w03JzslOdELtVdTAmsGRUm

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill in your keys.
3. Run the app: `npm run dev`

### Connecting to Supabase (real data & auth)

Without Supabase configured, the app runs in **demo mode** with mock quests and no login. To use the real database:

1. **Create a project** at [supabase.com/dashboard](https://supabase.com/dashboard) (or use an existing one).
2. **Get your API keys:** Project → **Settings** → **API**.
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`
3. **Add to `.env.local`:**
   ```bash
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```
4. **Create the tables:** In the Supabase dashboard, open **SQL Editor**, paste the contents of [supabase_schema.sql](supabase_schema.sql), and run it. This creates `profiles` and `quests` and sets up Row Level Security.
5. Restart the dev server (`npm run dev`). You should see the **Auth** screen; sign up or log in to use your real profile and quests.

## Deploy

The app is a static Vite build. Deploy the `dist/` folder to any static host.

1. **Build:** `npm run build`
2. **Set env vars** on your host: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `GEMINI_API_KEY` (for AI quest analysis).
3. **Redirects (SPA):** All routes must serve `index.html` so the app can handle client-side routing.

### Vercel

- Push to GitHub, then [vercel.com](https://vercel.com) → Import project.
- Add **Environment Variables** in the dashboard (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
- Build command: `npm run build`, Output directory: `dist`. Vercel detects Vite and sets this automatically.

### Netlify

- Push to GitHub, then [netlify.com](https://netlify.com) → Add new site → Import from Git.
- Build command: `npm run build`, Publish directory: `dist`.
- Add env vars in Site settings → Environment variables.
- Add `public/_redirects` with: `/* /index.html 200` (or use the Netlify UI: Redirects → add rule `/* /index.html 200`).

### Other hosts

- Use the same pattern: build → upload `dist/`, configure SPA fallback so all requests serve `index.html`.

## PWA — Install on your phone

The app is a **Progressive Web App (PWA)**. After you deploy it:

1. Open the **deployed URL** in your phone’s browser (e.g. Chrome on Android, Safari on iOS).
2. **Android (Chrome):** Menu (⋮) → “Install app” or “Add to Home screen.”
3. **iOS (Safari):** Share → “Add to Home Screen” → Add.
4. Open Axiom from your home screen; it runs in a standalone window without the browser UI.

Updates are applied automatically when you reopen the app. For a custom app icon on iOS, add `public/icons/icon-192.png` (192×192) and `public/icons/icon-512.png` (512×512); the build already includes a default icon.
