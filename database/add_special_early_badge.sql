-- ============================================================================
-- SPECIAL EARLY ADOPTER HOLOGRAPHIC BADGE
-- Limited time exclusive - only available to early users
-- ============================================================================

-- Add the special holographic badge
INSERT INTO badges (id, name, description, icon, rarity, unlockable) VALUES
  (
    'neon_pioneer',
    'Neon Pioneer',
    '⚡ EXCLUSIVE ⚡ Awarded to early operators who reached 2500 XP during the Genesis Phase. This holographic badge is a permanent mark of being among the first to explore the DevPulse Arcade.',
    '🌈',
    'holographic',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create trigger function to auto-grant at 2500 XP milestone
CREATE OR REPLACE FUNCTION check_neon_pioneer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_badge BOOLEAN;
  v_total_xp INTEGER;
BEGIN
  -- Check if user already has Neon Pioneer badge
  SELECT EXISTS(
    SELECT 1 FROM user_badges
    WHERE user_id = NEW.user_id AND badge_id = 'neon_pioneer'
  ) INTO v_has_badge;

  IF v_has_badge THEN
    RETURN NEW;
  END IF;

  -- Get user's total XP
  SELECT total_xp INTO v_total_xp
  FROM user_arcade_profile
  WHERE user_id = NEW.user_id;

  -- Grant Neon Pioneer at 2500 XP
  IF v_total_xp >= 2500 THEN
    PERFORM grant_badge(NEW.user_id, 'neon_pioneer', jsonb_build_object(
      'granted_on', NOW(),
      'xp_at_grant', v_total_xp,
      'exclusive', 'Genesis Phase Limited Edition'
    ));

    RAISE NOTICE '🌈 Granted NEON PIONEER badge to user %! They are now part of the elite!', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on XP transactions to check milestone
DROP TRIGGER IF EXISTS trigger_neon_pioneer ON user_arcade_profile;
CREATE TRIGGER trigger_neon_pioneer
  AFTER UPDATE OF total_xp ON user_arcade_profile
  FOR EACH ROW
  WHEN (NEW.total_xp >= 2500 AND OLD.total_xp < 2500)
  EXECUTE FUNCTION check_neon_pioneer();

-- Update BadgeUnlockPopup color mapping for holographic rarity
-- (Frontend will need to handle 'holographic' rarity with rainbow/prismatic effect)

-- ============================================================================
-- NEON PIONEER BADGE IS LIVE!
-- ============================================================================
-- Auto-grants when user reaches 2500 total XP
-- Exclusive to early adopters - will be disabled after Genesis Phase
-- Holographic rarity = ultra rare prismatic visual effect
-- ============================================================================
