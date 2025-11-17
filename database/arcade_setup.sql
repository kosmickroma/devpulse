-- ============================================================================
-- DEVPULSE ARCADE DATABASE SETUP
-- Run this script in Supabase SQL Editor to set up the arcade system
-- ============================================================================

-- 1. Create game_high_scores table
-- Stores each user's high score for each game
CREATE TABLE IF NOT EXISTS game_high_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one high score per user per game
  UNIQUE(user_id, game_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_high_scores_game_score
ON game_high_scores(game_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_high_scores_user
ON game_high_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_game_high_scores_achieved
ON game_high_scores(achieved_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE game_high_scores ENABLE ROW LEVEL SECURITY;

-- Users can read all high scores (for leaderboard)
CREATE POLICY "Anyone can read high scores"
ON game_high_scores FOR SELECT
TO authenticated, anon
USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert own scores"
ON game_high_scores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own scores
CREATE POLICY "Users can update own scores"
ON game_high_scores FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);


-- 2. Create user_arcade_profile table
-- Stores user's arcade XP, level, badges, etc.
CREATE TABLE IF NOT EXISTS user_arcade_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_early_explorer BOOLEAN DEFAULT false,
  early_explorer_granted_at TIMESTAMP WITH TIME ZONE,
  daily_streak INTEGER DEFAULT 0,
  last_play_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_arcade_profile_user
ON user_arcade_profile(user_id);

-- RLS policies
ALTER TABLE user_arcade_profile ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (for leaderboards)
CREATE POLICY "Anyone can read arcade profiles"
ON user_arcade_profile FOR SELECT
TO authenticated, anon
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_arcade_profile FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_arcade_profile FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);


-- 3. Create XP transaction log (optional, for tracking XP awards)
CREATE TABLE IF NOT EXISTS arcade_xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  game_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arcade_xp_transactions_user
ON arcade_xp_transactions(user_id, created_at DESC);

ALTER TABLE arcade_xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own XP transactions"
ON arcade_xp_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- 4. Create award_xp function
-- Function to award XP to a user and update their profile
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_game_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Insert XP transaction
  INSERT INTO arcade_xp_transactions (user_id, amount, reason, game_id)
  VALUES (p_user_id, p_amount, p_reason, p_game_id);

  -- Update user profile with new XP
  INSERT INTO user_arcade_profile (user_id, total_xp, level)
  VALUES (p_user_id, p_amount, 1 + (p_amount / 100))
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_arcade_profile.total_xp + p_amount,
    level = 1 + ((user_arcade_profile.total_xp + p_amount) / 100),
    updated_at = NOW()
  RETURNING total_xp, level INTO v_new_total_xp, v_new_level;

  -- Log the result
  RAISE NOTICE 'Awarded % XP to user %. New total: % (Level %)',
    p_amount, p_user_id, v_new_total_xp, v_new_level;
END;
$$;


-- 5. Create leaderboard view
-- Joins game_high_scores with user_profiles to show rankings with usernames
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  ghs.game_id,
  ROW_NUMBER() OVER (PARTITION BY ghs.game_id ORDER BY ghs.score DESC, ghs.achieved_at ASC) as rank,
  up.username,
  ghs.score,
  ghs.achieved_at,
  ghs.metadata,
  ghs.user_id
FROM
  game_high_scores ghs
  INNER JOIN user_profiles up ON ghs.user_id = up.id
ORDER BY
  ghs.game_id, rank;

-- Grant permissions
GRANT SELECT ON leaderboard TO authenticated, anon;


-- 6. Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_game_high_scores_updated_at ON game_high_scores;
CREATE TRIGGER update_game_high_scores_updated_at
  BEFORE UPDATE ON game_high_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_arcade_profile_updated_at ON user_arcade_profile;
CREATE TRIGGER update_user_arcade_profile_updated_at
  BEFORE UPDATE ON user_arcade_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- You can now use the arcade features:
-- - Submit scores via /api/arcade/submit-score
-- - View leaderboards via /api/arcade/leaderboard/{game_id}
-- - Check user profiles via /api/arcade/profile
-- ============================================================================
