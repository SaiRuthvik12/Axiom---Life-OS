-- AXIOM PUSH SUBSCRIPTIONS SCHEMA
-- Run this in the Supabase SQL Editor AFTER supabase_schema.sql
-- Stores Web Push subscriptions per user for push notification delivery.

-- 0. Cleanup
DROP TABLE IF EXISTS push_subscriptions CASCADE;

-- 1. Create Push Subscriptions Table
create table push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  endpoint text not null,                    -- Web Push endpoint URL
  p256dh text not null,                      -- Client public key (base64)
  auth text not null,                        -- Auth secret (base64)
  timezone text default 'UTC',               -- IANA timezone (e.g. 'America/New_York')
  preferences jsonb default '{
    "quest_reminders": true,
    "world_events": true,
    "milestones": true,
    "weekly_recap": true
  }'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- One subscription per endpoint per user (prevents duplicates)
  unique(user_id, endpoint)
);

-- 2. Enable Row Level Security
alter table push_subscriptions enable row level security;

-- 3. RLS Policies — users can only manage their own subscriptions
create policy "Users can view own push subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions"
  on push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- 4. Index for fast lookups by user
create index idx_push_subscriptions_user_id on push_subscriptions(user_id);
