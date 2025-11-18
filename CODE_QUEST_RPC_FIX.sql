-- ============================================================================
-- CODE QUEST RPC FUNCTION CHECK & PERMISSIONS FIX
-- Questions exist but still getting 500 error? Check this.
-- ============================================================================

-- Step 1: Verify the RPC function exists and returns correct type
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_or_create_cq_progress';

-- Step 2: Check the actual return type definition
SELECT
    p.proname as function_name,
    pg_catalog.format_type(p.prorettype, NULL) as return_type
FROM pg_catalog.pg_proc p
WHERE p.proname = 'get_or_create_cq_progress';

-- ============================================================================
-- If function doesn't exist, you need to run code_quest_setup.sql
-- ============================================================================

-- Step 3: Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_cq_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_cq_xp(UUID, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cq_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_topic_mastery(UUID, VARCHAR, BOOLEAN) TO authenticated;

-- Step 4: Grant table permissions
GRANT SELECT ON code_quest_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON code_quest_progress TO authenticated;
GRANT INSERT, UPDATE ON code_quest_sessions TO authenticated;
GRANT INSERT ON code_quest_user_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON code_quest_topic_mastery TO authenticated;

-- ============================================================================
-- Step 5: Test the function directly (use your actual user_id)
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID from auth.users
-- ============================================================================

-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then test the function with YOUR user_id:
-- SELECT * FROM get_or_create_cq_progress('YOUR_USER_ID_HERE');

-- ============================================================================
-- If you get an error here, it tells us what's wrong!
-- ============================================================================

-- Step 6: Check if code_quest_progress table exists
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'code_quest_progress'
ORDER BY ordinal_position;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Step 1: Should return 1 row with routine_name = 'get_or_create_cq_progress'
-- Step 2: Should return return_type = 'code_quest_progress'
-- Step 5: Should return a row with user progress data
-- Step 6: Should return ~12 columns (user_id, total_xp, level, etc.)
-- ============================================================================
