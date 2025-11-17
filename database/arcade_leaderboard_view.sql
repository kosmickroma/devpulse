-- Create leaderboard view for arcade games
-- This view joins game_high_scores with user profiles to show rankings with usernames

-- First, create the view
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

-- Grant access to the view
GRANT SELECT ON leaderboard TO authenticated;
GRANT SELECT ON leaderboard TO anon;

-- Create an index on game_id for faster queries
-- Note: You can't create indexes directly on views, but the underlying table should have indexes
-- Make sure game_high_scores has an index on (game_id, score DESC)
CREATE INDEX IF NOT EXISTS idx_game_high_scores_game_score
ON game_high_scores(game_id, score DESC);

-- Also index on user_id for faster joins
CREATE INDEX IF NOT EXISTS idx_game_high_scores_user
ON game_high_scores(user_id);
