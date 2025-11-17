# Code Quest 500 Error - Debugging Guide

## Current Error
```
Error loading question: Error: Failed to load question
POST /api/arcade/codequest/question/random → 500 Internal Server Error
```

✅ Session started successfully
❌ Question loading failed

---

## Quick Fix - Run This SQL in Supabase

Copy and paste this **verification script** into your Supabase SQL Editor:

```sql
-- ============================================================================
-- CODE QUEST VERIFICATION & FIX SCRIPT
-- Run this to diagnose and fix the 500 error
-- ============================================================================

-- 1. Check if tables exist
SELECT
    'code_quest_questions' as table_name,
    COUNT(*) as row_count
FROM code_quest_questions
UNION ALL
SELECT
    'code_quest_progress' as table_name,
    COUNT(*) as row_count
FROM code_quest_progress;

-- 2. Check if RPC function exists
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%cq%'
ORDER BY routine_name;

-- 3. Verify questions are loaded
SELECT
    difficulty,
    tier,
    COUNT(*) as question_count
FROM code_quest_questions
GROUP BY difficulty, tier
ORDER BY tier, difficulty;

-- 4. Check if any questions exist with basic criteria
SELECT
    id,
    type,
    difficulty,
    tier,
    question
FROM code_quest_questions
WHERE difficulty = 1
AND tier <= 2
LIMIT 5;

-- ============================================================================
-- If the above shows 0 questions, run the questions file:
-- database/code_quest_questions_initial.sql
-- ============================================================================

-- If RPC functions are missing, run:
-- database/code_quest_setup.sql
-- ============================================================================
```

---

## Common Issues & Fixes

### Issue 1: No Questions Found (Most Likely!)
**Symptom:** Verification shows `0` questions in `code_quest_questions` table

**Fix:**
1. Open Supabase SQL Editor
2. Run the entire `database/code_quest_questions_initial.sql` file
3. Should insert 30 questions
4. Try the game again

---

### Issue 2: RPC Function Missing
**Symptom:** Verification shows no functions with 'cq' in the name

**Fix:**
1. The `code_quest_setup.sql` file didn't run completely
2. Re-run the **entire** `database/code_quest_setup.sql` file
3. Don't run it in chunks - run the whole file at once
4. Check for any SQL errors in the Supabase output

---

### Issue 3: Permission Error
**Symptom:** Backend logs show "permission denied" for RPC

**Fix:**
1. Run this in Supabase SQL Editor:
```sql
-- Grant permissions for Code Quest functions
GRANT EXECUTE ON FUNCTION get_or_create_cq_progress TO authenticated;
GRANT EXECUTE ON FUNCTION award_cq_xp TO authenticated;
GRANT EXECUTE ON FUNCTION update_cq_streak TO authenticated;
GRANT EXECUTE ON FUNCTION update_topic_mastery TO authenticated;

-- Grant table permissions
GRANT SELECT ON code_quest_questions TO authenticated;
GRANT INSERT, UPDATE ON code_quest_progress TO authenticated;
GRANT INSERT ON code_quest_sessions TO authenticated;
GRANT INSERT ON code_quest_user_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON code_quest_topic_mastery TO authenticated;
```

---

### Issue 4: Backend Not Deployed
**Symptom:** Game works but questions don't load

**Fix:**
1. Wait for Render backend deployment to complete
2. Check https://devpulse-api.onrender.com/docs
3. Should see `/api/arcade/codequest/question/random` endpoint
4. If missing, redeploy backend

---

## Step-by-Step Fresh Setup

If nothing works, start fresh:

### 1. Clear Code Quest Data (Optional - Nuclear Option)
```sql
-- WARNING: This deletes ALL Code Quest data!
DROP TABLE IF EXISTS code_quest_user_answers CASCADE;
DROP TABLE IF EXISTS code_quest_sessions CASCADE;
DROP TABLE IF EXISTS code_quest_topic_mastery CASCADE;
DROP TABLE IF EXISTS code_quest_progress CASCADE;
DROP TABLE IF EXISTS code_quest_questions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_or_create_cq_progress CASCADE;
DROP FUNCTION IF EXISTS award_cq_xp CASCADE;
DROP FUNCTION IF EXISTS update_cq_streak CASCADE;
DROP FUNCTION IF EXISTS update_topic_mastery CASCADE;
```

### 2. Run Setup (In Order!)
```sql
-- Step 1: Run the ENTIRE code_quest_setup.sql file
-- (Creates tables, indexes, functions, views)

-- Step 2: Run the ENTIRE code_quest_questions_initial.sql file
-- (Inserts 30 questions)

-- Step 3: Run permissions (from Issue 3 above)
```

### 3. Verify
```sql
-- Should return 30
SELECT COUNT(*) FROM code_quest_questions;

-- Should return multiple functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
    'get_or_create_cq_progress',
    'award_cq_xp',
    'update_cq_streak',
    'update_topic_mastery'
);
```

---

## Backend Logs to Check

If you have access to Render backend logs, look for:

**Good:**
```
User [user_id] fetched random question [question_id]
```

**Bad:**
```
Error fetching random question: [error details]
```

Common errors:
- `relation "code_quest_questions" does not exist` → Run setup SQL
- `function get_or_create_cq_progress does not exist` → Run setup SQL
- `permission denied` → Run permission grants
- `No questions found matching criteria` → Questions not seeded OR all filtered out

---

## Frontend Console Logs

Check browser console for these helpful logs:

**Session start success:**
```javascript
{session_id: "uuid-here", current_streak: 1, longest_streak: 1}
```

**Question load failure:**
```javascript
Error loading question: Error: Failed to load question
```

---

## After Fix - What Should Happen

1. ✅ Click "START QUEST" button
2. ✅ Session starts (no error)
3. ✅ Question loads with:
   - Code snippet (if applicable)
   - Question text
   - 4 options (A, B, C, D)
   - Timer counting down
   - Hearts showing lives
4. ✅ Click answer or press 1-4 / A-D
5. ✅ Feedback shows correct/incorrect
6. ✅ Next question loads
7. ✅ Game continues until 0 lives

---

## Still Not Working?

1. Check Render backend logs for specific error
2. Run the verification SQL script above
3. Share the output of the verification script
4. Check that backend redeploy finished successfully
5. Make sure you're signed in to DevPulse

---

## Most Likely Culprit

**99% chance it's this:**
The `code_quest_questions_initial.sql` file didn't run, so there are **0 questions** in the database.

**Quick test in Supabase:**
```sql
SELECT COUNT(*) FROM code_quest_questions;
```

If it returns `0`, run the questions file!
