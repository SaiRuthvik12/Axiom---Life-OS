-- ════════════════════════════════════════
-- Chronicle Schema — daily_logs
-- Run AFTER supabase_schema.sql and world/schema.sql
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,

  -- Quest activity
  quests_completed INTEGER DEFAULT 0,
  quests_pending INTEGER DEFAULT 0,
  quest_titles TEXT[] DEFAULT '{}',
  quest_types TEXT[] DEFAULT '{}',
  stats_touched TEXT[] DEFAULT '{}',

  -- Economy
  xp_earned INTEGER DEFAULT 0,
  xp_lost INTEGER DEFAULT 0,
  credits_earned INTEGER DEFAULT 0,
  credits_spent INTEGER DEFAULT 0,

  -- Player snapshot (end of day)
  player_level INTEGER,
  total_xp INTEGER,
  streak_count INTEGER,

  -- World snapshot (compact JSONB)
  world_snapshot JSONB,

  -- Events that occurred this day
  world_events JSONB DEFAULT '[]',

  -- AI-generated narrative (lazy-loaded)
  narrative_summary TEXT,

  -- Classification
  day_rating TEXT DEFAULT 'neutral',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, log_date)
);

-- Index for fast calendar queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);

-- Row Level Security
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logs"
  ON daily_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
