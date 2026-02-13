-- AXIOM LIFE OS SCHEMA :: RESET SCRIPT
-- WARNING: This will DELETE existing 'profiles' and 'quests' data.
-- Run this in the Supabase SQL Editor to ensure a clean slate.

-- 0. Cleanup Old Tables
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Create Profiles Table (Public User Data)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  avatar_url text,
  level int default 1,
  current_xp bigint default 0,
  next_level_xp bigint default 1000,
  credits bigint default 0,
  stats jsonb default '{"physical": 10, "cognitive": 10, "career": 10, "financial": 10, "mental": 10, "creative": 10}'::jsonb,
  streak int default 0,
  risk_tolerance text default 'MEDIUM',
  last_active_date text, -- Stores YYYY-MM-DD for streak tracking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Quests Table (Tasks)
create table quests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  type text not null, -- DAILY, WEEKLY, EPIC
  difficulty text not null, -- EASY, MEDIUM, HARD, EXTREME
  xp_reward int default 0,
  credit_reward int default 0,
  stat_rewards jsonb default '{}'::jsonb, -- NEW: Stores map of { "physical": 5, "mental": 2 }
  penalty_description text,
  status text default 'PENDING',
  data_source text default 'MANUAL_OVERRIDE',
  linked_stat text default 'mental', -- Deprecated in favor of stat_rewards, kept for fallback
  deadline text,
  last_completed_at timestamp with time zone, -- For daily reset logic
  last_penalty_at text, -- Stores YYYY-MM-DD: tracks when quest was last penalized (prevents repeat penalties)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table quests enable row level security;

-- 4. Create Policies (Security Rules)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own quests" on quests for select using (auth.uid() = user_id);
create policy "Users can insert own quests" on quests for insert with check (auth.uid() = user_id);
create policy "Users can update own quests" on quests for update using (auth.uid() = user_id);
create policy "Users can delete own quests" on quests for delete using (auth.uid() = user_id);