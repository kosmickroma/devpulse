-- ============================================================================
-- UPDATE LEADERBOARD VIEW TO INCLUDE EQUIPPED BADGES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop and recreate the leaderboard view with badge information
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  ghs.game_id,
  ROW_NUMBER() OVER (PARTITION BY ghs.game_id ORDER BY ghs.score DESC, ghs.achieved_at ASC) as rank,
  up.username,
  ghs.score,
  ghs.achieved_at,
  ghs.metadata,
  ghs.user_id,
  -- Add equipped badge information
  b.icon as badge_icon,
  b.name as badge_name,
  b.rarity as badge_rarity
FROM
  game_high_scores ghs
  INNER JOIN user_profiles up ON ghs.user_id = up.id
  -- LEFT JOIN to get equipped badge (if any)
  LEFT JOIN user_badges ub ON ghs.user_id = ub.user_id AND ub.is_equipped = true
  LEFT JOIN badges b ON ub.badge_id = b.id
ORDER BY
  ghs.game_id, rank;

-- ============================================================================
-- LEADERBOARD NOW INCLUDES:
-- - badge_icon (emoji, NULL if no badge equipped)
-- - badge_name (badge name, NULL if no badge equipped)
-- - badge_rarity (rarity level, NULL if no badge equipped)
-- ============================================================================
