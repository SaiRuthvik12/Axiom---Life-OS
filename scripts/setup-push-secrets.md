# Set Supabase secrets for push notifications

Use the keys you got from `node scripts/generate-vapid-keys.mjs`.

## 1. Install Supabase CLI and log in

**macOS (recommended):**
```bash
brew install supabase/tap/supabase
supabase login
```

**Or use npx (no install):** use `npx supabase` instead of `supabase` in every command below.

(Browser will open to log in.)

## 2. Link this project to your Supabase project

Get your **Project ref** from the Supabase dashboard URL:  
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

Then run (from the Axiom repo root):

```bash
cd /Users/sairuthvikathota/Developer/Axiom
supabase link --project-ref YOUR_PROJECT_REF
```

## 3. Set the secrets

Run these **one at a time** (paste your real keys; the ones below are placeholders from your script output):

```bash
supabase secrets set VAPID_PRIVATE_KEY="MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgD9wqOkcvMuVKPvsU-hrkxPfbXd3nIZLuZ3VLd8tVsJyhRANCAAQ3vqPZEmOXePg7SW1Vrvu8Xlbwn6v6e9WsofRbu82_hmavuM_F5svValDivCdVYFqB2tAA556qZGtva1drp1nB"

supabase secrets set VAPID_PUBLIC_KEY="BDe-o9kSY5d4-DtJbVWu-7xeVvCfq_p71ayh9Fu7zb-GZq-4z8Xmy9VqUOK8J1VgWoHa0ADnnqpka29rV2unWcE"

supabase secrets set VAPID_SUBJECT="mailto:your@email.com"
```
(Change `your@email.com` to your real email.)

```bash
supabase secrets set CRON_SECRET="$(openssl rand -hex 32)"
```
(Or pick any long random string; the cron job will need this later.)

## 4. Confirm

```bash
supabase secrets list
```

You should see `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET`.

## 5. Add public key to your app (.env.local)

In `.env.local` add:

```
VITE_VAPID_PUBLIC_KEY=BDe-o9kSY5d4-DtJbVWu-7xeVvCfq_p71ayh9Fu7zb-GZq-4z8Xmy9VqUOK8J1VgWoHa0ADnnqpka29rV2unWcE
```

(Use the same public key value you set as `VAPID_PUBLIC_KEY`.)

## 6. Deploy the function

```bash
supabase functions deploy check-reminders --no-verify-jwt
```

---

## What’s next after Supabase

### 1. Create the push_subscriptions table (if you haven’t)

In the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), run the full contents of **`push_subscriptions_schema.sql`** from this repo. That creates the table and RLS so the app can store notification subscriptions.

### 2. Confirm .env.local has the VAPID public key

Your `.env.local` should include:

```
VITE_VAPID_PUBLIC_KEY=BDe-o9kSY5d4-DtJbVWu-7xeVvCfq_p71ayh9Fu7zb-GZq-4z8Xmy9VqUOK8J1VgWoHa0ADnnqpka29rV2unWcE
```

(Use your real public key if it’s different.) Restart the dev server after changing env.

### 3. Set up the hourly cron job

Quest reminders and weekly recap are sent by the Edge Function when it’s called every hour. Use one of these:

**Option A — [cron-job.org](https://cron-job.org) (free)**  
1. Sign up and create a new cron job.  
2. **URL:** `https://cybctyrgsmnqkqbjxpji.supabase.co/functions/v1/check-reminders`  
3. **Schedule:** Every hour (e.g. `0 * * * *`).  
4. **Method:** POST.  
5. **Headers:**  
   - `x-cron-secret`: the value you set for `CRON_SECRET` (the 64-char hex string).  
   - `Authorization`: `Bearer` + your Supabase anon key (from Dashboard → Settings → API).

**Option B — GitHub Actions**  
Add `.github/workflows/cron-reminders.yml` that runs hourly and `curl`-posts to the same URL with the same headers, using repo secrets for `CRON_SECRET` and the anon key.

### 4. Try it in the app

1. Run `npm run dev`, open the app, and log in.  
2. Accept the “Enable notifications?” banner (or turn them on in **System Core → Notifications**).  
3. You should get a browser prompt; allow notifications.  
4. Local notifications (world events, milestones) work as soon as you have permission.  
5. Quest reminders and weekly recap will fire when the cron runs at the right local time (9 PM daily, Friday 9 PM weekly, etc.).
