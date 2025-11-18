-- ============================================================================
-- CODEQUEST SCHEMA V2 - Professional Quest System
-- Adds tier/level progression, unlock system, and improved XP tracking
-- ============================================================================

-- 1. Add level column to questions table
ALTER TABLE code_quest_questions
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Create index for faster tier/level queries
CREATE INDEX IF NOT EXISTS idx_cq_questions_tier_level
ON code_quest_questions(tier, level);

-- 2. Create level progress tracking table
CREATE TABLE IF NOT EXISTS code_quest_level_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  level INT NOT NULL,
  questions_answered INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  unlocked BOOLEAN DEFAULT FALSE,
  best_session_accuracy DECIMAL(5,2) DEFAULT 0,
  first_completed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tier, level)
);

CREATE INDEX idx_cq_level_progress_user ON code_quest_level_progress(user_id);
CREATE INDEX idx_cq_level_progress_tier ON code_quest_level_progress(tier, level);

-- 3. Create tier unlock tracking table
CREATE TABLE IF NOT EXISTS code_quest_tier_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  quest_unlocked BOOLEAN DEFAULT FALSE,
  time_attack_unlocked BOOLEAN DEFAULT FALSE,
  quest_unlocked_at TIMESTAMPTZ,
  time_attack_unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tier)
);

CREATE INDEX idx_cq_tier_unlocks_user ON code_quest_tier_unlocks(user_id);

-- 4. Update user_answers table for attempt tracking
ALTER TABLE code_quest_user_answers
ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS tier INT,
ADD COLUMN IF NOT EXISTS level INT,
ADD COLUMN IF NOT EXISTS is_replay BOOLEAN DEFAULT FALSE;

-- 5. Update sessions table for level tracking
ALTER TABLE code_quest_sessions
ADD COLUMN IF NOT EXISTS tier INT,
ADD COLUMN IF NOT EXISTS level INT,
ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'quest'; -- 'quest' or 'timeattack'

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Initialize user's tier/level access
CREATE OR REPLACE FUNCTION initialize_cq_access(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Unlock Tier 1
  INSERT INTO code_quest_tier_unlocks (user_id, tier, quest_unlocked, quest_unlocked_at)
  VALUES (p_user_id, 1, TRUE, NOW())
  ON CONFLICT (user_id, tier) DO NOTHING;

  -- Unlock Tier 1, Level 1
  INSERT INTO code_quest_level_progress (user_id, tier, level, unlocked)
  VALUES (p_user_id, 1, 1, TRUE)
  ON CONFLICT (user_id, tier, level) DO NOTHING;
END;
$$;

-- Function: Check and unlock next level
CREATE OR REPLACE FUNCTION check_level_unlock(
  p_user_id UUID,
  p_tier INT,
  p_level INT,
  p_accuracy DECIMAL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_level INT;
  v_all_completed BOOLEAN;
  v_unlocked_next BOOLEAN := FALSE;
  v_unlocked_tier BOOLEAN := FALSE;
  v_unlocked_time_attack BOOLEAN := FALSE;
BEGIN
  -- If accuracy >= 80%, unlock next level
  IF p_accuracy >= 80.0 THEN
    v_next_level := p_level + 1;

    -- Check if next level exists (max 5 levels per tier)
    IF v_next_level <= 5 THEN
      INSERT INTO code_quest_level_progress (user_id, tier, level, unlocked)
      VALUES (p_user_id, p_tier, v_next_level, TRUE)
      ON CONFLICT (user_id, tier, level)
      DO UPDATE SET unlocked = TRUE;

      v_unlocked_next := TRUE;
    END IF;

    -- Check if ALL levels in this tier are completed with 80%+
    SELECT BOOL_AND(completed AND accuracy >= 80.0) INTO v_all_completed
    FROM code_quest_level_progress
    WHERE user_id = p_user_id
      AND tier = p_tier
      AND level BETWEEN 1 AND 5;

    IF v_all_completed THEN
      -- Unlock next tier's Quest mode
      INSERT INTO code_quest_tier_unlocks (user_id, tier, quest_unlocked, quest_unlocked_at)
      VALUES (p_user_id, p_tier + 1, TRUE, NOW())
      ON CONFLICT (user_id, tier)
      DO UPDATE SET quest_unlocked = TRUE, quest_unlocked_at = NOW();

      -- Unlock first level of next tier
      INSERT INTO code_quest_level_progress (user_id, tier, level, unlocked)
      VALUES (p_user_id, p_tier + 1, 1, TRUE)
      ON CONFLICT (user_id, tier, level)
      DO UPDATE SET unlocked = TRUE;

      v_unlocked_tier := TRUE;

      -- Unlock Time Attack for CURRENT tier
      UPDATE code_quest_tier_unlocks
      SET time_attack_unlocked = TRUE, time_attack_unlocked_at = NOW()
      WHERE user_id = p_user_id AND tier = p_tier;

      v_unlocked_time_attack := TRUE;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'unlocked_next_level', v_unlocked_next,
    'unlocked_next_tier', v_unlocked_tier,
    'unlocked_time_attack', v_unlocked_time_attack,
    'next_level', v_next_level
  );
END;
$$;

-- Function: Get user's level progress
CREATE OR REPLACE FUNCTION get_user_level_progress(p_user_id UUID)
RETURNS TABLE (
  tier INT,
  level INT,
  unlocked BOOLEAN,
  completed BOOLEAN,
  accuracy DECIMAL,
  questions_answered INT,
  questions_correct INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user has initial access
  PERFORM initialize_cq_access(p_user_id);

  RETURN QUERY
  SELECT
    lp.tier,
    lp.level,
    lp.unlocked,
    lp.completed,
    lp.accuracy,
    lp.questions_answered,
    lp.questions_correct
  FROM code_quest_level_progress lp
  WHERE lp.user_id = p_user_id
  ORDER BY lp.tier, lp.level;
END;
$$;

-- Function: Get user's tier unlocks
CREATE OR REPLACE FUNCTION get_user_tier_unlocks(p_user_id UUID)
RETURNS TABLE (
  tier INT,
  quest_unlocked BOOLEAN,
  time_attack_unlocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user has initial access
  PERFORM initialize_cq_access(p_user_id);

  RETURN QUERY
  SELECT
    tu.tier,
    tu.quest_unlocked,
    tu.time_attack_unlocked
  FROM code_quest_tier_unlocks tu
  WHERE tu.user_id = p_user_id
  ORDER BY tu.tier;
END;
$$;

-- ============================================================================
-- UPDATE EXISTING award_cq_xp FUNCTION - NEW GRINDABLE FORMULA
-- ============================================================================

CREATE OR REPLACE FUNCTION award_cq_xp(
    p_user_id UUID,
    p_xp INT,
    p_session_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_level INT;
    v_new_level INT;
    v_old_xp INT;
    v_new_xp INT;
    v_old_tier INT;
    v_new_tier INT;
    v_leveled_up BOOLEAN := FALSE;
BEGIN
    -- Get current progress
    SELECT total_xp, level, current_tier
    INTO v_old_xp, v_old_level, v_old_tier
    FROM code_quest_progress
    WHERE user_id = p_user_id;

    -- Add XP
    v_new_xp := v_old_xp + p_xp;

    -- NEW GRINDABLE FORMULA: 1500 XP per level
    v_new_level := FLOOR(v_new_xp / 1500.0) + 1;

    -- Calculate new tier based on level
    v_new_tier := CASE
        WHEN v_new_level <= 5 THEN 1
        WHEN v_new_level <= 10 THEN 2
        WHEN v_new_level <= 20 THEN 3
        WHEN v_new_level <= 35 THEN 4
        WHEN v_new_level <= 50 THEN 5
        ELSE 6
    END;

    -- Check if leveled up
    IF v_new_level > v_old_level THEN
        v_leveled_up := true;
    END IF;

    -- Update progress
    UPDATE code_quest_progress
    SET
        total_xp = v_new_xp,
        level = v_new_level,
        current_tier = v_new_tier,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Award XP to global DevPulse arcade system
    PERFORM award_xp(
        p_user_id,
        p_xp,
        'code_quest',
        'codequest'
    );

    -- Update session if provided
    IF p_session_id IS NOT NULL THEN
        UPDATE code_quest_sessions
        SET xp_earned = xp_earned + p_xp
        WHERE id = p_session_id;
    END IF;

    RETURN jsonb_build_object(
        'xp_awarded', p_xp,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'old_tier', v_old_tier,
        'new_tier', v_new_tier,
        'leveled_up', v_leveled_up,
        'total_xp', v_new_xp,
        'xp_to_next_level', (v_new_level * 1500) - v_new_xp
    );
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cq_level_progress_updated_at ON code_quest_level_progress;
CREATE TRIGGER update_cq_level_progress_updated_at
    BEFORE UPDATE ON code_quest_level_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON code_quest_level_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON code_quest_tier_unlocks TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_cq_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_level_unlock(UUID, INT, INT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_level_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tier_unlocks(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- You can now run tier1_questions.sql to populate the questions!
