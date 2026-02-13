-- ══════════════════════════════════════════════════
-- AXIOM WORLD SYSTEM :: DATABASE SCHEMA
-- ══════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor AFTER the main schema.
-- This adds the world_states table alongside existing profiles/quests.

-- 0. Cleanup
DROP TABLE IF EXISTS world_states CASCADE;

-- World States Table
-- Stores the entire world state as a single JSONB document per user.
-- This avoids complex relational modeling for a deeply nested game state
-- and allows the schema to evolve without migrations.
create table if not exists world_states (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  state jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table world_states enable row level security;

-- Security Policies (users can only access their own world)
create policy "Users can view own world"
  on world_states for select
  using (auth.uid() = user_id);

create policy "Users can insert own world"
  on world_states for insert
  with check (auth.uid() = user_id);

create policy "Users can update own world"
  on world_states for update
  using (auth.uid() = user_id);

-- Auto-update the updated_at timestamp
create or replace function update_world_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger world_states_updated_at
  before update on world_states
  for each row
  execute function update_world_timestamp();
