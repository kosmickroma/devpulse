-- ============================================================================
-- QUICK FIX: Verify question data and RPC function
-- ============================================================================

-- Step 1: Check what questions actually exist with their difficulty/tier
SELECT
    difficulty,
    tier,
    COUNT(*) as count
FROM code_quest_questions
GROUP BY difficulty, tier
ORDER BY tier, difficulty;

-- Expected: Should show questions with difficulty 1-2, tier 1-2

-- Step 2: Check if get_or_create_cq_progress is returning correct data structure
-- Replace YOUR_USER_ID with your actual UUID from auth.users
SELECT id FROM auth.users LIMIT 1;
-- Copy the UUID above, then run:
-- SELECT * FROM get_or_create_cq_progress('YOUR_USER_ID_HERE'::UUID);

-- Expected: Should return a row with columns: user_id, level, current_tier, etc.
-- level should be 1, current_tier should be 1 for new users

-- ============================================================================
-- If Step 1 shows NO questions with difficulty 1, tier 1-2:
-- Then questions weren't seeded properly - run code_quest_questions_initial.sql
-- ============================================================================

-- ============================================================================
-- If Step 2 returns nothing or errors:
-- Then RPC function is broken - run code_quest_setup.sql
-- ============================================================================

-- TEMPORARY FIX: Remove the difficulty filter to see if ANY questions load
-- This is a test - if this returns questions, we know the filter is too strict

SELECT
    id,
    difficulty,
    tier,
    type,
    question
FROM code_quest_questions
WHERE tier <= 2
LIMIT 5;

-- If this returns questions, the issue is the difficulty filter
-- If this returns 0, questions weren't seeded at all
