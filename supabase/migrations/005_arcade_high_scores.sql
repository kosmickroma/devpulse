-- Arcade High Scores and User Progress System
-- Migration: 005_arcade_high_scores.sql

-- User arcade profile (passive XP tracking + early user badge)
CREATE TABLE IF NOT EXISTS user_arcade_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_early_explorer BOOLEAN DEFAULT FALSE, -- Beta Explorer badge
  early_explorer_granted_at TIMESTAMP,
  daily_streak INTEGER DEFAULT 0,
  last_play_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- High scores for all games (replaces localStorage)
CREATE TABLE IF NOT EXISTS game_high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL, -- 'snake', 'bagels', 'startrek', etc.
  score INTEGER NOT NULL,
  metadata JSONB, -- game-specific data (e.g., {length: 25, duration: 180})
  achieved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Global leaderboard (denormalized for performance)
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50),
  score INTEGER NOT NULL,
  rank INTEGER,
  metadata JSONB,
  achieved_at TIMESTAMP DEFAULT NOW()
);

-- XP history (passive tracking for future features)
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL, -- 'game_complete', 'high_score_beat', 'daily_login'
  game_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_high_scores_game_id ON game_high_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_high_scores_user_id ON game_high_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_id_rank ON leaderboard(game_id, rank);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);

-- Function to update leaderboard when high score is submitted
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old leaderboard entry for this user/game if exists
  DELETE FROM leaderboard WHERE user_id = NEW.user_id AND game_id = NEW.game_id;

  -- Insert new leaderboard entry
  INSERT INTO leaderboard (game_id, user_id, username, score, metadata, achieved_at)
  SELECT
    NEW.game_id,
    NEW.user_id,
    COALESCE(u.raw_user_meta_data->>'username', u.email),
    NEW.score,
    NEW.metadata,
    NEW.achieved_at
  FROM auth.users u
  WHERE u.id = NEW.user_id;

  -- Update ranks for this game
  WITH ranked_scores AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY score DESC) as new_rank
    FROM leaderboard
    WHERE game_id = NEW.game_id
  )
  UPDATE leaderboard l
  SET rank = rs.new_rank
  FROM ranked_scores rs
  WHERE l.id = rs.id AND l.game_id = NEW.game_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when high score changes
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON game_high_scores;
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT OR UPDATE ON game_high_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard();

-- Function to award XP and update profile
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason VARCHAR(100),
  p_game_id VARCHAR(50) DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Insert XP history
  INSERT INTO xp_history (user_id, amount, reason, game_id)
  VALUES (p_user_id, p_amount, p_reason, p_game_id);

  -- Update user profile
  INSERT INTO user_arcade_profile (user_id, total_xp, level, updated_at)
  VALUES (p_user_id, p_amount, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_arcade_profile.total_xp + p_amount,
    level = CASE
      WHEN user_arcade_profile.total_xp + p_amount >= 5000 THEN 10
      WHEN user_arcade_profile.total_xp + p_amount >= 2500 THEN 6
      WHEN user_arcade_profile.total_xp + p_amount >= 1500 THEN 5
      WHEN user_arcade_profile.total_xp + p_amount >= 1000 THEN 4
      WHEN user_arcade_profile.total_xp + p_amount >= 500 THEN 3
      WHEN user_arcade_profile.total_xp + p_amount >= 200 THEN 2
      ELSE 1
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant early explorer badge to existing users (run once on deployment)
-- This will mark all current users as "Beta Explorers"
CREATE OR REPLACE FUNCTION grant_early_explorer_badge()
RETURNS void AS $$
BEGIN
  INSERT INTO user_arcade_profile (user_id, is_early_explorer, early_explorer_granted_at)
  SELECT id, TRUE, NOW()
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM user_arcade_profile)
  ON CONFLICT (user_id) DO UPDATE SET
    is_early_explorer = TRUE,
    early_explorer_granted_at = COALESCE(user_arcade_profile.early_explorer_granted_at, NOW());
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE user_arcade_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own arcade profile"
  ON user_arcade_profile FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own profile
CREATE POLICY "Users can update own arcade profile"
  ON user_arcade_profile FOR ALL
  USING (auth.uid() = user_id);

-- Users can submit their own high scores
CREATE POLICY "Users can submit own high scores"
  ON game_high_scores FOR ALL
  USING (auth.uid() = user_id);

-- Everyone can view leaderboards
CREATE POLICY "Anyone can view leaderboards"
  ON leaderboard FOR SELECT
  USING (true);

-- Users can view their own XP history
CREATE POLICY "Users can view own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE user_arcade_profile IS 'User gaming profile with XP, level, and badges';
COMMENT ON TABLE game_high_scores IS 'Personal best scores for each game per user';
COMMENT ON TABLE leaderboard IS 'Global leaderboard rankings for all games';
COMMENT ON TABLE xp_history IS 'Transaction log of all XP awarded to users';
COMMENT ON COLUMN user_arcade_profile.is_early_explorer IS 'Beta Explorer badge for users who joined before launch';
