-- ============================================================================
-- CODE QUEST PERMISSIONS - Run this entire script
-- ============================================================================

-- Grant RPC function execution to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_cq_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_cq_xp(UUID, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cq_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_topic_mastery(UUID, VARCHAR, BOOLEAN) TO authenticated;

-- Grant table permissions
GRANT SELECT ON code_quest_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON code_quest_progress TO authenticated;
GRANT INSERT, UPDATE ON code_quest_sessions TO authenticated;
GRANT INSERT ON code_quest_user_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON code_quest_topic_mastery TO authenticated;

-- Grant view access (for leaderboard)
GRANT SELECT ON code_quest_leaderboard TO authenticated;

-- ============================================================================
-- After running this, try the game again!
-- ============================================================================
