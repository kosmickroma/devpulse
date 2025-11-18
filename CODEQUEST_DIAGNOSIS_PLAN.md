# CodeQuest Issues - Diagnosis & Fix Plan

**Date:** Nov 18, 2025
**Issues Reported:**
1. All answers still showing as "A" (not randomized)
2. XP progress bar showing 0% (not tracking level)

---

## Issue 1: Answers Still All "A"

### Current Implementation

**Backend:** `api/arcade/codequest.py`
- `shuffle_question_options()` function exists (lines 61-101)
- Called on line 155 before returning question
- Uses Fisher-Yates shuffle algorithm
- Tracks correct answer through shuffle

**Frontend:** `frontend/components/games/CodeQuest.tsx`
- Removed frontend shuffle code
- Expects pre-shuffled questions from backend

### Possible Causes

1. **Backend Not Redeployed**
   - Code was committed but Render didn't redeploy
   - Still serving old version without shuffle

2. **Shuffle Not Being Called**
   - Function exists but not in the right place
   - Multiple code paths that bypass shuffle

3. **Shuffle Logic Issue**
   - Logic is wrong (unlikely - looks correct)
   - Database has no variation in answers

4. **Caching Issue**
   - Questions cached before shuffle was added
   - Frontend caching responses

### Diagnostic Steps

1. **Check if backend is using new code:**
   - Add debug logging to shuffle function
   - Check Render deployment logs
   - Verify latest commit is deployed

2. **Test shuffle function directly:**
   - Add temporary endpoint to test shuffle
   - Print before/after question to console

3. **Check all code paths:**
   - Verify shuffle is called in BOTH paths (with/without exclude_ids)
   - Make sure no early returns skip shuffle

4. **Check database:**
   - Query actual questions from DB
   - Verify correct answers aren't all "A" in database

### Fix Strategy

**Step 1:** Verify backend deployment
- Check Render dashboard
- Check deployment logs
- Force redeploy if needed

**Step 2:** Add logging to confirm shuffle is running
```python
def shuffle_question_options(question: dict) -> dict:
    print(f"SHUFFLE INPUT - correct: {question['correct']}, options: {question['options']}")
    # ... shuffle logic ...
    print(f"SHUFFLE OUTPUT - correct: {new_correct_key}, options: {shuffled_options}")
    return {...}
```

**Step 3:** Verify BOTH code paths call shuffle
- Line ~145: with exclude_ids (random.choice from filtered list)
- Line ~152: without exclude_ids (random.choice from all)
- BOTH must call shuffle before returning

**Step 4:** Test with frontend
- Clear browser cache
- Play a level
- Check if answers vary

---

## Issue 2: XP Progress Bar Shows 0%

### Current Implementation

**Component:** `frontend/components/games/XPProgressBar.tsx`
- Displays current XP and level
- Shows progress to next level

**Data Source:** `frontend/components/games/CodeQuest.tsx`
- `userXP` state loaded from API
- `userLevel` calculated from XP
- Passed to XPProgressBar component

### Possible Causes

1. **XP Not Being Loaded**
   - API call failing silently
   - User not authenticated
   - Wrong endpoint

2. **XP Not Being Awarded**
   - Backend not saving XP after answers
   - RPC function not working
   - User ID mismatch

3. **XP Bar Not Receiving Props**
   - Props not passed correctly
   - Component not rendering
   - Default values (0) being used

4. **Progress Calculation Wrong**
   - Level formula incorrect
   - Always calculating 0%

### Diagnostic Steps

1. **Check if XP is being loaded:**
   - Open browser console
   - Check Network tab for API calls
   - Look for `/api/arcade/codequest/progress` call
   - Check response data

2. **Check if XP is being awarded:**
   - Submit a correct answer
   - Check Network tab for `/api/arcade/codequest/answer` call
   - Check response for xp_earned field
   - Verify database updated

3. **Check XP Bar component:**
   - Add console.log to XPProgressBar
   - Verify props are received
   - Check if rendering correctly

4. **Check database directly:**
   - Query code_quest_users table
   - Check if user has XP record
   - Verify XP value is correct

### Fix Strategy

**Step 1:** Check API response
- Open browser DevTools
- Play CodeQuest
- Check Network tab for progress API call
- Note what data is returned

**Step 2:** Check if XP is being awarded
- Answer a question correctly
- Check answer API response
- Should see xp_earned value
- Check if total_xp updates

**Step 3:** Verify component props
- Add logging to CodeQuest component
- Log userXP and userLevel values
- Verify XPProgressBar receives them

**Step 4:** Check RPC function
- Verify award_cq_xp function exists in database
- Check if it's being called
- Check for errors in Supabase logs

---

## Questions to Ask User

1. **Backend Deployment:**
   - "Did Render automatically redeploy after the last push?"
   - "Can you check the Render dashboard and tell me the latest deployment time?"

2. **Answer Randomization:**
   - "Can you open browser DevTools, go to Network tab, and show me the response from the question API?"
   - "I'll need to see the 'options' object to verify if shuffle is happening"

3. **XP Progress:**
   - "Open DevTools Console and Network tab"
   - "Play a question and show me what the /answer API returns"
   - "Show me what the /progress API returns"

---

## Implementation Priority

1. **First:** Diagnose answer randomization (backend deployment issue most likely)
2. **Second:** Fix XP progress bar (likely API/data loading issue)
3. **Third:** Test end-to-end to verify both work

---

## Next Steps

1. Ask user for diagnostic info (API responses, deployment status)
2. Add debug logging if needed
3. Fix issues based on diagnosis
4. Test thoroughly
5. Document fixes
