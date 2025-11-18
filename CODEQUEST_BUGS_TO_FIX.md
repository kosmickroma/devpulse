# CodeQuest Bugs to Fix

**Discovered:** Nov 18, 2025 during Tier 1 testing
**Status:** Ready to fix

## Bug 1: All Correct Answers are "A"
**Issue:** Every question has the correct answer as option A
**Expected:** Correct answers should be randomized among A/B/C/D
**Cause:** Questions stored in database with fixed correct answer, options not shuffled
**Fix:** Shuffle options when displaying question, track original correct answer

## Bug 2: Question Counter Shows 21/20
**Issue:** Level shows "Question 21/20" before completion
**Expected:** Should stop at exactly 20/20
**Status:** PARTIALLY FIXED (stops at 20 questions now)
**Remaining Issue:** Display shows 21/21 on completion screen
**Fix:** Use answeredQuestionIds.length instead of questionNumber state

## Bug 3: Completion Screen Shows Score
**Issue:** Completion screen displays "Score: 21/21" which is redundant with accuracy
**Expected:** Remove score display, only show accuracy percentage
**Fix:** Remove score line from game over screen

## Bug 4: Completion Screen Off-Center
**Issue:** Level completion screen is aligned to the left instead of centered
**Expected:** Should be centered like other screens
**Fix:** Add centering classes to completion screen container

---

## Fixes to Implement

### 1. Randomize Answer Options
**File:** `frontend/components/games/CodeQuest.tsx`
**Function:** `loadQuestion()` or create new `shuffleOptions()`

```typescript
const shuffleOptions = (question: Question) => {
  // Get all options as array
  const optionsArray = [
    { key: 'A', value: question.options.A },
    { key: 'B', value: question.options.B },
    { key: 'C', value: question.options.C },
    { key: 'D', value: question.options.D }
  ]

  // Find which one is correct
  const correctValue = question.options[question.correct]

  // Shuffle the values
  const values = optionsArray.map(o => o.value)
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]]
  }

  // Rebuild options object with shuffled values
  const shuffledOptions = {
    A: values[0],
    B: values[1],
    C: values[2],
    D: values[3]
  }

  // Find new correct key
  const newCorrectKey = Object.entries(shuffledOptions).find(
    ([key, value]) => value === correctValue
  )?.[0] || 'A'

  return {
    ...question,
    options: shuffledOptions,
    correct: newCorrectKey
  }
}
```

### 2. Fix Question Counter Display
**File:** `frontend/components/games/CodeQuest.tsx`
**Location:** Game over screen (line ~670)

**Change:**
```typescript
// OLD:
<div className="text-green-400">Score: {score} / {questionNumber}</div>

// NEW:
<div className="text-green-400">Questions Answered: {answeredQuestionIds.length}</div>
// OR just remove this line completely
```

### 3. Remove Score from Completion Screen
**File:** `frontend/components/games/CodeQuest.tsx`
**Location:** Game over screen

**Remove this line:**
```typescript
<div className="text-green-400">Score: {score} / {questionNumber}</div>
```

Keep:
- Tier/Level display
- Total XP Earned
- Best Combo
- Accuracy percentage (the important one!)

### 4. Center Completion Screen
**File:** `frontend/components/games/CodeQuest.tsx`
**Location:** Game over screen container

**Change:**
```typescript
// OLD:
<div className="h-full flex items-center justify-center p-6">

// Make sure it's:
<div className="h-full w-full flex items-center justify-center p-6">
  <div className="text-center space-y-6 max-w-2xl">
```

---

## Testing Checklist

After fixes:
- [ ] Play through a level, verify answer options are randomized (not always A)
- [ ] Complete 20 questions, verify counter shows 20/20 (not 21)
- [ ] Check completion screen - no "Score" line displayed
- [ ] Verify completion screen is centered
- [ ] Verify accuracy percentage is correct
- [ ] Test on both passed (≥80%) and failed (<80%) levels

---

## Current Session Progress

**Completed Today:**
1. ✅ Fixed question flash between screens
2. ✅ Fixed 20-question limit (was going to 22)
3. ✅ Added "Back to Menu" button
4. ✅ Restored 3 vault games (LUNAR, HAMMURABI, BLACKJACK)
5. ✅ Updated all documentation

**To Do:**
1. Fix answer randomization
2. Fix question counter display
3. Remove score from completion
4. Center completion screen

**Ready to fix!** 🎯
