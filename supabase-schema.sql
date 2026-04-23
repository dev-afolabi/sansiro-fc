-- Enable Row Level Security
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_goals INTEGER DEFAULT 0,
  total_conceded INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_days table
CREATE TABLE IF NOT EXISTS match_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  aside_size INTEGER NOT NULL CHECK (aside_size IN (8, 9, 10)),
  backman_a UUID REFERENCES players(id),
  backman_b UUID REFERENCES players(id),
  players UUID[] NOT NULL DEFAULT '{}',
  team_a UUID[] NOT NULL DEFAULT '{}',
  team_b UUID[] NOT NULL DEFAULT '{}',
  score_a INTEGER,
  score_b INTEGER,
  goal_scorers JSONB DEFAULT '[]',
  assists JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'teamsheet', 'teams', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_match_days_user_id ON match_days(user_id);
CREATE INDEX IF NOT EXISTS idx_match_days_status ON match_days(status);
CREATE INDEX IF NOT EXISTS idx_match_days_date ON match_days(date DESC);

-- Enable RLS on tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_days ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own players" ON players
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own match days" ON match_days
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_days_updated_at BEFORE UPDATE ON match_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION v2: Substitutes + Public Read Access
-- Run these statements against your existing Supabase project.
-- ============================================================

-- 1. Add substitute columns to match_days
ALTER TABLE match_days
  ADD COLUMN IF NOT EXISTS substitutes_a UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS substitutes_b UUID[] NOT NULL DEFAULT '{}';

-- 2. Drop the broad FOR ALL policies (they block verb-specific ones)
DROP POLICY IF EXISTS "Users can only see their own players" ON players;
DROP POLICY IF EXISTS "Users can only see their own match days" ON match_days;

-- 3. Players: public SELECT, authenticated-only writes
CREATE POLICY "Public can read players"
  ON players FOR SELECT USING (true);

CREATE POLICY "Owners can insert players"
  ON players FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update players"
  ON players FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete players"
  ON players FOR DELETE USING (auth.uid() = user_id);

-- 4. Match days: public SELECT, authenticated-only writes
CREATE POLICY "Public can read match_days"
  ON match_days FOR SELECT USING (true);

CREATE POLICY "Owners can insert match_days"
  ON match_days FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update match_days"
  ON match_days FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete match_days"
  ON match_days FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- MIGRATION v3: Global shared data — any authenticated user
-- can read and write all records (single-club app model).
-- Run these statements in the Supabase SQL editor.
-- ============================================================

-- Drop the owner-only UPDATE / DELETE policies
DROP POLICY IF EXISTS "Owners can update players"    ON players;
DROP POLICY IF EXISTS "Owners can delete players"    ON players;
DROP POLICY IF EXISTS "Owners can update match_days" ON match_days;
DROP POLICY IF EXISTS "Owners can delete match_days" ON match_days;

-- Replace with authenticated-user-wide UPDATE / DELETE policies
CREATE POLICY "Auth users can update players"
  ON players FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete players"
  ON players FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can update match_days"
  ON match_days FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete match_days"
  ON match_days FOR DELETE USING (auth.role() = 'authenticated');