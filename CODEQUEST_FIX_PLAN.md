# CodeQuest Build Fix Plan

**Problem:** Build failing due to type errors in answer randomization code

## Root Cause Analysis

The frontend `shuffleOptions()` function tries to access `question.correct`, but:
- The backend API intentionally does NOT send the `correct` field to frontend (security)
- The `Question` interface doesn't include `correct` property
- Frontend can't shuffle options without knowing which one is correct

## Solution: Backend Shuffling

Move the shuffle logic to the **backend** where we have access to the correct answer.

### Backend Changes (api/arcade/codequest.py)

**Location:** `get_question_by_level()` function, before returning response

```python
def shuffle_question_options(question: dict) -> dict:
    """Shuffle question options while tracking the correct answer."""
    import random

    # Get the correct answer key (A, B, C, or D)
    correct_key = question['correct']

    # Get the correct answer value
    options = question['options']
    correct_value = options[correct_key]

    # Create array of all option values
    values = [options['A'], options['B'], options['C'], options['D']]

    # Fisher-Yates shuffle
    for i in range(len(values) - 1, 0, -1):
        j = random.randint(0, i)
        values[i], values[j] = values[j], values[i]

    # Rebuild options dict with shuffled values
    shuffled_options = {
        'A': values[0],
        'B': values[1],
        'C': values[2],
        'D': values[3]
    }

    # Find which key now has the correct value
    new_correct_key = None
    for key, value in shuffled_options.items():
        if value == correct_value:
            new_correct_key = key
            break

    # Return updated question
    return {
        **question,
        'options': shuffled_options,
        'correct': new_correct_key
    }
```

**Apply to response:**
```python
# Before returning, shuffle the options
question = shuffle_question_options(question)

# Remove correct answer from response (still happens after shuffle)
response_question = {
    'id': question['id'],
    # ... rest of fields
}
```

### Frontend Changes (CodeQuest.tsx)

**Remove the entire `shuffleOptions()` function** (lines 129-165)

**Remove the shuffle call** in `loadQuestion()`:
```typescript
const data = await response.json()

// REMOVE THIS:
// const shuffledQuestion = shuffleOptions(data)
// setQuestion(shuffledQuestion)

// REPLACE WITH:
setQuestion(data)
```

## Files to Modify

1. **api/arcade/codequest.py**
   - Add `shuffle_question_options()` helper function
   - Call it in `get_question_by_level()` before removing correct answer
   - Ensures every question sent to frontend has randomized options

2. **frontend/components/games/CodeQuest.tsx**
   - Remove `shuffleOptions()` function (lines 129-165)
   - Remove call to `shuffleOptions()` in `loadQuestion()` (line 270)
   - Just use data directly: `setQuestion(data)`

## Testing Checklist

After fixes:
- [ ] Build succeeds (no type errors)
- [ ] Questions load correctly
- [ ] Correct answers are randomized (not always A)
- [ ] Submitting answers works
- [ ] XP is awarded correctly
- [ ] Level completion works

## Implementation Steps

1. Update backend API to shuffle options server-side
2. Remove frontend shuffle code
3. Test locally that answers are randomized
4. Commit and push
5. Verify Vercel build succeeds
6. Test in production

---

**Status:** Ready to implement
**Estimated Time:** 15 minutes
**Risk:** Low - isolated change, easy to test
