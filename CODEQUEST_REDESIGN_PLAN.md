# 🎮 CODEQUEST PROFESSIONAL REDESIGN - Implementation Plan

**Status:** Questions complete, ready for implementation
**Date:** November 17, 2025
**Commits:**
- `b85be91` - 100 Tier 1 questions added
- `8dca45c` - Previous attempt (needs to be reverted/replaced)

---

## ✅ COMPLETED

### 1. Question Database (100 questions)
- **File:** `/database/tier1_questions.sql`
- **Structure:**
  - **Level 1:** Print, variables, simple math (20 questions)
  - **Level 2:** Strings, concatenation, repetition (20 questions)
  - **Level 3:** Lists, indexing, len() (20 questions)
  - **Level 4:** Conditionals, if/else, comparisons (20 questions)
  - **Level 5:** Loops, for/while, break/continue (20 questions)
- **XP:** 30 base XP per question
- **Time:** 15-20 seconds per question
- **Progression:** Duolingo-style progressive learning

### 2. TO TEST BEFORE BUILDING
Run this in Supabase SQL Editor:
```sql
-- Run the entire tier1_questions.sql file
-- It will DELETE existing tier 1 questions and insert 100 new ones
```

**Verify:**
- Questions load correctly
- Difficulty progression makes sense
- Explanations are clear
- No SQL errors

---

## 🎯 SYSTEM DESIGN (Approved)

### Game Modes

#### **QUEST MODE** (Main Learning Path)
- **Structure:** Tier 1 → 5 Levels → 20 Questions per level
- **Lives:** 5 lives per session
- **Wrong Answer Flow:**
  - 1st wrong: Lose 1 life, can retry same question
  - 2nd wrong: Lose another life, show answer + explanation, click to continue
- **Progression:** 80% accuracy on ALL levels in tier unlocks next tier + time attack
- **Replay:** Can replay any level for 50% XP

#### **TIME ATTACK MODE** (Speed Challenge)
- **Timer:** 2 minutes
- **Scoring:** How many correct answers in 2 minutes
- **Questions:** Same pool, different UI/feel
- **Unlock:** Complete corresponding tier in Quest mode
- **Leaderboard:** Separate from Quest mode

### XP & Leveling

**XP Formula:** `level = floor(total_xp / 1500) + 1`

**Progression:**
- Level 2: 1,500 XP (~50 questions)
- Level 5: 7,500 XP (~250 questions)
- Level 10: 15,000 XP (~500 questions)

**XP Per Question:**
- Base: 30 XP (Tier 1)
- Speed bonus: 1.25x-1.5x (fast answers)
- Combo bonus: 2x-5x (streaks)
- Replay: 50% of base (15 XP)

**Full Tier 1:** ~4,000-5,000 XP total (with combos)

---

## 🔨 TO BUILD (Tomorrow)

### Phase 1: Database Schema Updates

**File:** Create `/database/codequest_schema_v2.sql`

**Changes needed:**

1. **Add `level` column to code_quest_questions table:**
```sql
ALTER TABLE code_quest_questions
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_cq_questions_tier_level
ON code_quest_questions(tier, level);
```

2. **Add progression tracking table:**
```sql
CREATE TABLE IF NOT EXISTS code_quest_level_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  level INT NOT NULL,
  questions_answered INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  unlocked BOOLEAN DEFAULT TRUE, -- Level 1 of Tier 1 starts unlocked
  first_completed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tier, level)
);

CREATE INDEX idx_cq_level_progress_user ON code_quest_level_progress(user_id);
```

3. **Add tier unlock tracking:**
```sql
CREATE TABLE IF NOT EXISTS code_quest_tier_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  quest_unlocked BOOLEAN DEFAULT FALSE,
  time_attack_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, tier)
);
```

4. **Update XP formula in award_cq_xp:**
```sql
-- Change from: v_new_level := FLOOR(SQRT(v_new_xp / 100.0)) + 1;
-- To: v_new_level := FLOOR(v_new_xp / 1500.0) + 1;
```

5. **Track question attempts (for retry logic):**
```sql
ALTER TABLE code_quest_user_answers
ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS question_level INT,
ADD COLUMN IF NOT EXISTS tier INT;
```

### Phase 2: Backend API Updates

**File:** `/api/arcade/codequest.py`

**New/Updated Endpoints:**

1. **GET `/question/by-level`** - Get questions for specific tier/level
```python
@router.get('/question/by-level')
async def get_question_by_level(
    tier: int,
    level: int,
    exclude_ids: Optional[str] = None,  # Comma-separated question IDs already answered
    current_user: dict = Depends(get_current_user)
):
    # Get random question from this tier/level
    # Exclude already answered questions in current session
    # Return question without correct answer
```

2. **POST `/level/start`** - Start a level session
```python
@router.post('/level/start')
async def start_level(
    tier: int,
    level: int,
    current_user: dict = Depends(get_current_user)
):
    # Create session
    # Check if level is unlocked
    # Return session_id
```

3. **POST `/level/complete`** - Complete a level, check unlock
```python
@router.post('/level/complete')
async def complete_level(
    session_id: str,
    tier: int,
    level: int,
    questions_answered: int,
    questions_correct: int,
    current_user: dict = Depends(get_current_user)
):
    # Calculate accuracy
    # Update level_progress
    # Check if 80%+ accuracy
    # Check if ALL levels in tier are 80%+
    # If yes: unlock next tier + time attack
    # Return unlock status
```

4. **GET `/progress/levels`** - Get all level progress
```python
@router.get('/progress/levels')
async def get_level_progress(
    current_user: dict = Depends(get_current_user)
):
    # Return all tier/level progress
    # Return unlock status
    # Return overall stats
```

5. **Update `/answer`** - Track attempts, handle XP reduction
```python
# Add attempt tracking
# If replay (level already completed): xp * 0.5
# Track which attempt (1st, 2nd)
```

### Phase 3: Frontend - Quest Mode UI

**File:** `/frontend/components/games/CodeQuest.tsx`

**Major Changes:**

1. **New State Variables:**
```typescript
const [gameMode, setGameMode] = useState<'menu' | 'quest' | 'timeattack'>('menu')
const [currentTier, setCurrentTier] = useState(1)
const [currentLevel, setCurrentLevel] = useState(1)
const [lives, setLives] = useState(5)
const [questionAttempts, setQuestionAttempts] = useState<Record<string, number>>({})
const [levelProgress, setLevelProgress] = useState<any[]>([])
const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([])
```

2. **Menu Screen:**
```
┌─────────────────────────────────────┐
│   ⚡ PYTHON CODE QUEST              │
│                                     │
│   [XP Progress Bar Component]       │
│                                     │
│   ┌─────────────┐  ┌──────────────┐│
│   │   📚 QUEST  │  │ ⏱️ TIME      ││
│   │    MODE     │  │   ATTACK     ││
│   │             │  │              ││
│   │  [START]    │  │  [LOCKED]    ││
│   └─────────────┘  └──────────────┘│
└─────────────────────────────────────┘
```

3. **Level Selection Screen:**
```
┌─────────────────────────────────────┐
│  TIER 1: BEGINNER PYTHON            │
│                                     │
│  ╔═══════╗  ╔═══════╗  ╔═══════╗  │
│  ║ LVL 1 ║  ║ LVL 2 ║  ║ LVL 3 ║  │
│  ║  ✓    ║  ║  🔓   ║  ║  🔒   ║  │
│  ║ 95%   ║  ║  --   ║  ║  --   ║  │
│  ╚═══════╝  ╚═══════╝  ╚═══════╝  │
│                                     │
│  ╔═══════╗  ╔═══════╗              │
│  ║ LVL 4 ║  ║ LVL 5 ║              │
│  ║  🔒   ║  ║  🔒   ║              │
│  ╚═══════╝  ╚═══════╝              │
└─────────────────────────────────────┘
```

4. **Playing Screen Updates:**
- Add lives display (5 hearts)
- Show current tier/level
- Track attempts per question
- Show retry vs continue logic

5. **Wrong Answer Flow:**
```typescript
const handleWrongAnswer = (questionId: string) => {
  const attempts = questionAttempts[questionId] || 0

  if (attempts === 0) {
    // First wrong - lose life, can retry
    setLives(prev => prev - 1)
    setQuestionAttempts(prev => ({...prev, [questionId]: 1}))
    setGameState('retry')
  } else {
    // Second wrong - lose life, show answer, move on
    setLives(prev => prev - 1)
    setGameState('showAnswer')
  }
}
```

### Phase 4: XP Progress Bar Component

**File:** Create `/frontend/components/games/XPProgressBar.tsx`

**Features:**
```typescript
interface XPProgressBarProps {
  currentXP: number
  currentLevel: number
  onLevelUp?: () => void
}

// Visual Design:
// ┌────────────────────────────────────────┐
// │ LEVEL 3  [████████░░░░] 1,245/4,500 XP│
// └────────────────────────────────────────┘
```

**Animations:**
- Smooth progress bar fill with gradient
- Sci-fi glow effect
- On level up:
  - Flash animation
  - Number change with pop effect
  - Particle burst
  - Sound effect (optional)

**Styling:**
```css
/* Retro sci-fi progress bar */
.xp-bar-container {
  background: linear-gradient(90deg, #0a0a0f, #1a1a2e);
  border: 2px solid cyan;
  box-shadow: 0 0 20px rgba(0,255,255,0.5);
}

.xp-bar-fill {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  animation: shimmer 2s infinite;
  box-shadow: inset 0 0 10px rgba(255,255,255,0.5);
}

.level-up-flash {
  animation: levelUpPulse 0.5s ease-out;
}

@keyframes levelUpPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); filter: brightness(2); }
}
```

### Phase 5: Time Attack Mode

**File:** `/frontend/components/games/TimeAttack.tsx`

**Features:**
- 2 minute countdown timer (big and visible)
- Rapid-fire questions
- Score counter
- Questions from unlocked tiers only
- Different visual style (more intense colors, faster animations)
- Submit score to separate leaderboard

**UI:**
```
┌─────────────────────────────────────┐
│  ⏱️ 1:34  |  Score: 12  |  ❤️❤️❤️ │
│                                     │
│  [Question display - minimal]       │
│                                     │
│  [A] [B] [C] [D]                   │
│  (Bigger buttons for speed)         │
└─────────────────────────────────────┘
```

---

## 📋 TESTING CHECKLIST

### Database
- [ ] tier1_questions.sql runs without errors
- [ ] All 100 questions inserted
- [ ] Schema updates work
- [ ] XP formula updated correctly

### Backend
- [ ] Can fetch questions by tier/level
- [ ] Level unlocking works
- [ ] 80% accuracy check works
- [ ] Tier unlock triggers properly
- [ ] XP reduction for replays works

### Frontend - Quest Mode
- [ ] Level selection shows correctly
- [ ] Locked levels can't be played
- [ ] Lives system works (5 lives)
- [ ] Retry logic works (2 attempts max)
- [ ] Show answer after 2nd wrong
- [ ] 20 questions per level
- [ ] Level completion works
- [ ] Accuracy calculation correct
- [ ] Tier unlock notification shows

### Frontend - XP Progress Bar
- [ ] Displays current level/XP
- [ ] Progress bar fills correctly
- [ ] Level up animation triggers
- [ ] Number changes smoothly
- [ ] Looks retro sci-fi

### Frontend - Time Attack
- [ ] 2 minute timer works
- [ ] Score increments correctly
- [ ] Only shows unlocked tier questions
- [ ] Different visual feel from Quest
- [ ] Leaderboard saves correctly

---

## 🚀 DEPLOYMENT ORDER

1. **Database First:**
   - Run tier1_questions.sql
   - Run schema_v2.sql
   - Test queries manually

2. **Backend:**
   - Deploy new endpoints
   - Test with Postman/curl
   - Verify XP calculations

3. **Frontend:**
   - Build Quest mode
   - Build XP bar
   - Build Time Attack
   - Test full flow locally

4. **Production:**
   - Push all changes
   - Redeploy backend (Render)
   - Redeploy frontend (Vercel)
   - Test in production

---

## 💡 NOTES

### Current Issues to Fix
- Remove the difficulty range query added in commit `8dca45c`
- Revert to fresh start with new system

### XP Balance
- Designed to be grindy but rewarding
- ~500 questions to reach level 10
- Feels professional, not casual

### Future Tiers
- Tier 2: Lists, dicts, functions (difficulty 4-6)
- Tier 3: Classes, file I/O, advanced (difficulty 7-10)
- Each tier: 100 questions (5 levels × 20 questions)

### User Feedback
- Watch for questions too hard/easy
- Adjust XP if leveling too fast/slow
- Monitor completion rates

---

## 🎨 DESIGN REFERENCES

### Colors
- **Quest Mode:** Green/Cyan (learning focus)
- **Time Attack:** Red/Orange (speed/urgency)
- **Progress Bar:** Cyan→Magenta gradient
- **Level Up:** Gold flash

### Fonts
- **Main:** Space Mono (monospace, retro)
- **Numbers:** Exo 2 (bold, sci-fi)

### Animations
- **Smooth:** 300ms easing
- **Fast:** 150ms for micro-interactions
- **Impact:** 500ms for level up

---

## READY FOR TOMORROW! ✅

**Start here:**
1. Test tier1_questions.sql in Supabase
2. Review question difficulty/progression
3. Continue with Phase 1: Database Schema Updates

**Ping me when ready to code!** 🚀
