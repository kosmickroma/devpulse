-- ============================================================================
-- DEVPULSE ARCADE BADGE SYSTEM
-- Run this in Supabase SQL Editor to add badges
-- ============================================================================

-- 1. Create badges table (defines all available badges)
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  rarity TEXT NOT NULL, -- common, uncommon, rare, epic, legendary
  unlockable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_badges table (tracks which users have which badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT false, -- whether badge is shown on profile
  metadata JSONB DEFAULT '{}'::jsonb,

  -- User can only have one instance of each badge
  UNIQUE(user_id, badge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_equipped ON user_badges(user_id, is_equipped) WHERE is_equipped = true;

-- RLS policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can read all badges
CREATE POLICY "Anyone can read badges"
ON badges FOR SELECT
TO authenticated, anon
USING (true);

-- Anyone can read user badges (for displaying on profiles/leaderboards)
CREATE POLICY "Anyone can read user badges"
ON user_badges FOR SELECT
TO authenticated, anon
USING (true);

-- Users can insert their own badges (via backend only, but allow for flexibility)
CREATE POLICY "Users can receive badges"
ON user_badges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own badges (equip/unequip)
CREATE POLICY "Users can update own badges"
ON user_badges FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Insert default badges
INSERT INTO badges (id, name, description, icon, rarity, unlockable) VALUES
  ('beta_explorer', 'Beta Explorer', 'One of the first to discover the DevPulse Arcade', '🌟', 'epic', true),
  ('arcade_champion_monthly', 'Arcade Champion', 'Top XP earner this month', '👑', 'legendary', false),
  ('speed_demon', 'Speed Demon', 'Complete any game in record time', '⚡', 'rare', true),
  ('perfect_score', 'Perfectionist', 'Achieve a perfect score in any game', '💯', 'rare', true),
  ('vault_master', 'Vault Master', 'Complete all BASIC games', '📼', 'epic', true),
  ('snake_legend', 'Snake Legend', 'Score 1000+ in Snake', '🐍', 'uncommon', true),
  ('mines_expert', 'Mines Expert', 'Win Minesweeper on Hard difficulty', '💣', 'uncommon', true),
  ('nim_champion', 'Nim Champion', 'Win 10 games of Nim', '🎯', 'common', true),
  ('xp_milestone_1000', '1K XP Club', 'Earn 1000 total XP', '🎖️', 'uncommon', true),
  ('xp_milestone_5000', '5K XP Elite', 'Earn 5000 total XP', '🏅', 'rare', true),
  ('xp_milestone_10000', '10K XP Legend', 'Earn 10000 total XP', '🏆', 'epic', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Function to grant badge to user
CREATE OR REPLACE FUNCTION grant_badge(
  p_user_id UUID,
  p_badge_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_exists BOOLEAN;
  v_already_has_badge BOOLEAN;
BEGIN
  -- Check if badge exists
  SELECT EXISTS(SELECT 1 FROM badges WHERE id = p_badge_id) INTO v_badge_exists;

  IF NOT v_badge_exists THEN
    RAISE EXCEPTION 'Badge % does not exist', p_badge_id;
  END IF;

  -- Check if user already has this badge
  SELECT EXISTS(
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO v_already_has_badge;

  IF v_already_has_badge THEN
    RETURN false; -- User already has this badge
  END IF;

  -- Grant the badge
  INSERT INTO user_badges (user_id, badge_id, metadata)
  VALUES (p_user_id, p_badge_id, p_metadata);

  RAISE NOTICE 'Granted badge % to user %', p_badge_id, p_user_id;
  RETURN true;
END;
$$;

-- 5. Function to check and auto-grant Beta Explorer badge on first game
CREATE OR REPLACE FUNCTION check_beta_explorer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_badge BOOLEAN;
  v_game_count INTEGER;
BEGIN
  -- Check if user already has Beta Explorer badge
  SELECT EXISTS(
    SELECT 1 FROM user_badges
    WHERE user_id = NEW.user_id AND badge_id = 'beta_explorer'
  ) INTO v_has_badge;

  IF v_has_badge THEN
    RETURN NEW;
  END IF;

  -- Count how many games they've played (including this one)
  SELECT COUNT(*) INTO v_game_count
  FROM game_high_scores
  WHERE user_id = NEW.user_id;

  -- Grant Beta Explorer on their first game
  IF v_game_count = 1 THEN
    PERFORM grant_badge(NEW.user_id, 'beta_explorer', jsonb_build_object(
      'granted_on', NOW(),
      'first_game', NEW.game_id
    ));
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-grant Beta Explorer
DROP TRIGGER IF EXISTS trigger_beta_explorer ON game_high_scores;
CREATE TRIGGER trigger_beta_explorer
  AFTER INSERT ON game_high_scores
  FOR EACH ROW
  EXECUTE FUNCTION check_beta_explorer();

-- ============================================================================
-- BADGE SYSTEM READY!
-- ============================================================================
-- Beta Explorer badge will auto-grant on first game played
-- Other badges can be granted via grant_badge() function
-- ============================================================================
