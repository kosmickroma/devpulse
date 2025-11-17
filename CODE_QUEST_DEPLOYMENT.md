# Code Quest Database Deployment Guide

## Overview
Code Quest is currently experiencing a 500 error because the database schema hasn't been deployed to Supabase yet. Follow these steps to get it working.

## Prerequisites
- Access to Supabase SQL Editor for your project
- Backend API deployed (already done)
- Frontend deployed (already done)

## Step 1: Deploy Database Schema

Run these SQL files **in order** in your Supabase SQL Editor:

### 1. Create Code Quest Tables & Functions
```
database/code_quest_setup.sql
```

This creates:
- `code_quest_questions` table (stores all Python quiz questions)
- `code_quest_progress` table (tracks user progress, XP, level, streaks)
- `code_quest_sessions` table (game session history)
- `code_quest_user_answers` table (answer history)
- `code_quest_topic_mastery` table (tracks mastery of 20 Python topics)
- `code_quest_leaderboard` view (integrates with main arcade leaderboard)
- Functions: `award_cq_xp`, `update_cq_streak`, `get_or_create_cq_progress`, etc.
- **6 Code Quest badges** including `python_prodigy` and `streak_legend`

### 2. Seed Initial Questions
```
database/code_quest_questions_initial.sql
```

This adds:
- 30 high-quality Python questions (Tier 1-2)
- 5 question types: output prediction, bug hunt, fill blank, code completion, best practice
- Topics: variables, strings, lists, loops, functions, dictionaries, etc.

## Step 2: Verify Badge Icons

Make sure the Neon Pioneer badge has the correct icon:

```sql
UPDATE badges
SET icon = '/badges/neon-pioneer.svg'
WHERE id = 'neon_pioneer';
```

## Step 3: Test the Game

1. Go to https://devpulse-1z8l.vercel.app/arcade
2. Click "PYTHON CODE QUEST" or type `play codequest`
3. Game should now load without 500 errors
4. Questions will appear, lives/combo/XP systems work

## What Works After Deployment

✅ Code Quest game fully functional
✅ Questions load from database
✅ Lives, combos, speed bonuses working
✅ XP awarded to user's DevPulse profile
✅ Progress tracked (streak, level, topic mastery)
✅ Leaderboard integration
✅ Badges unlock (`python_prodigy` at level 10, `streak_legend` at 100-day streak)
✅ Contributes to Neon Pioneer badge (2500 XP milestone)

## Known Limitation

⚠️ **Combo multiplier XP not fully integrated**

The frontend calculates combo multipliers (2x/3x/5x for streaks), but these aren't sent back to the backend. The backend only receives base XP + speed bonus.

**To fix this later:** Modify the `/api/arcade/codequest/answer` endpoint to accept a `combo_multiplier` parameter and apply it server-side.

## Troubleshooting

**Still getting 500 errors?**
- Check Supabase logs for SQL errors
- Verify both SQL files ran successfully
- Make sure `grant_badge` function exists (from main arcade setup)

**Questions not loading?**
- Verify `code_quest_questions_initial.sql` ran successfully
- Check if questions exist: `SELECT COUNT(*) FROM code_quest_questions;`

**XP not appearing in profile?**
- Check user_arcade_profile table exists
- Verify `award_cq_xp` function created successfully
- Check backend logs for RPC call errors

## Database Schema Overview

### Tables
- **code_quest_questions** - Question bank with 5 types
- **code_quest_progress** - Per-user progress (XP, level, streak, combo)
- **code_quest_sessions** - Game sessions
- **code_quest_user_answers** - Answer history
- **code_quest_topic_mastery** - Topic-by-topic mastery tracking

### Integration Points
- XP awards automatically update `user_arcade_profile.total_xp`
- Badge unlocks use shared `grant_badge()` function
- Leaderboard integrates with main arcade leaderboard
- Streak system encourages daily play

## Next Phase Features (Not Yet Implemented)

- Frontend → Backend combo XP integration
- Daily challenge mode
- Topic-specific practice mode
- Question difficulty adaptation based on accuracy
- More badges (Perfect Session, Topic Master, Speed Demon, etc.)
