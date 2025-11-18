"""
Python Code Quest API endpoints - V2 Professional Quest System
Handles tier/level progression, Quest mode, Time Attack mode
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
import os
import random
from datetime import date, datetime
from api.utils.auth import get_current_user

router = APIRouter()

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase env vars not set for Code Quest")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================================
# MODELS
# ============================================================================

class AnswerSubmission(BaseModel):
    question_id: str
    user_answer: str  # A, B, C, or D
    time_taken: float  # seconds
    session_id: Optional[str] = None
    attempt_number: int = 1
    tier: int
    level: int


class LevelComplete(BaseModel):
    session_id: str
    tier: int
    level: int
    questions_answered: int
    questions_correct: int
    best_combo: int


class SessionStart(BaseModel):
    tier: int
    level: int
    mode: str = 'quest'  # 'quest' or 'timeattack'


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def shuffle_question_options(question: dict) -> dict:
    """
    Shuffle question options while tracking the correct answer.
    This ensures correct answers are randomized (not always 'A').
    Uses question ID as seed for consistent shuffling.
    """
    # Get the correct answer key (A, B, C, or D)
    correct_key = question['correct']

    # Get the correct answer value
    options = question['options']
    correct_value = options[correct_key]

    # Create array of all option values
    values = [options['A'], options['B'], options['C'], options['D']]

    # Use question ID as seed for consistent shuffling
    # This ensures the same question always shuffles the same way
    question_id_hash = hash(str(question['id']))
    rng = random.Random(question_id_hash)

    # Fisher-Yates shuffle with seeded random
    for i in range(len(values) - 1, 0, -1):
        j = rng.randint(0, i)
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


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get('/question/by-level')
async def get_question_by_level(
    tier: int,
    level: int,
    exclude_ids: Optional[str] = None,  # Comma-separated IDs
    current_user: dict = Depends(get_current_user)
):
    """
    Get a random question from a specific tier and level.
    Excludes already-answered questions in current session.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Build query for this specific tier/level
        query = supabase.table('code_quest_questions')\
            .select('*')\
            .eq('tier', tier)\
            .eq('level', level)

        # Exclude already answered questions
        if exclude_ids:
            excluded_list = exclude_ids.split(',')
            # Supabase postgrest doesn't have NOT IN, so we fetch all and filter
            result = query.execute()

            if not result.data:
                raise HTTPException(status_code=404, detail=f"No questions found for Tier {tier}, Level {level}")

            # Filter out excluded IDs
            available = [q for q in result.data if q['id'] not in excluded_list]

            if not available:
                raise HTTPException(status_code=404, detail="No more questions available in this level")

            question = random.choice(available)
        else:
            result = query.execute()
            if not result.data:
                raise HTTPException(status_code=404, detail=f"No questions found for Tier {tier}, Level {level}")

            question = random.choice(result.data)

        # Shuffle options to randomize correct answer position
        question = shuffle_question_options(question)

        # Remove correct answer from response
        response_question = {
            'id': question['id'],
            'type': question['type'],
            'difficulty': question['difficulty'],
            'tier': question['tier'],
            'level': question['level'],
            'topics': question['topics'],
            'code': question.get('code'),
            'question': question['question'],
            'options': question['options'],
            'hint': question.get('hint'),
            'time_limit': question.get('time_limit', 20)
        }

        return response_question

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching question by level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/session/start')
async def start_session(
    session_data: SessionStart,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new Quest or Time Attack session for a specific level.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Initialize user access if needed
        supabase.rpc('initialize_cq_access', {'p_user_id': user_id}).execute()

        # Check if level is unlocked
        if session_data.mode == 'quest':
            progress = supabase.table('code_quest_level_progress')\
                .select('unlocked')\
                .eq('user_id', user_id)\
                .eq('tier', session_data.tier)\
                .eq('level', session_data.level)\
                .execute()

            if not progress.data or not progress.data[0]['unlocked']:
                raise HTTPException(status_code=403, detail="Level not unlocked")

        # For time attack, check tier unlock
        elif session_data.mode == 'timeattack':
            tier_unlock = supabase.table('code_quest_tier_unlocks')\
                .select('time_attack_unlocked')\
                .eq('user_id', user_id)\
                .eq('tier', session_data.tier)\
                .execute()

            if not tier_unlock.data or not tier_unlock.data[0]['time_attack_unlocked']:
                raise HTTPException(status_code=403, detail="Time Attack not unlocked for this tier")

        # Update streak
        supabase.rpc('update_cq_streak', {'p_user_id': user_id}).execute()

        # Create session
        session = supabase.table('code_quest_sessions').insert({
            'user_id': user_id,
            'tier': session_data.tier,
            'level': session_data.level,
            'mode': session_data.mode,
            'questions_answered': 0,
            'questions_correct': 0,
            'xp_earned': 0
        }).execute()

        return {
            'session_id': session.data[0]['id'],
            'tier': session_data.tier,
            'level': session_data.level,
            'mode': session_data.mode
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/answer')
async def submit_answer(
    submission: AnswerSubmission,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit an answer with attempt tracking and replay detection.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Get question to check correct answer
        question = supabase.table('code_quest_questions')\
            .select('*')\
            .eq('id', submission.question_id)\
            .execute()

        if not question.data:
            raise HTTPException(status_code=404, detail="Question not found")

        q = question.data[0]

        # Apply the same shuffle that was used when sending the question
        # This ensures we check against the shuffled version the user saw
        q = shuffle_question_options(q)

        is_correct = submission.user_answer.upper() == q['correct'].upper()

        # Check if this level is already completed (replay)
        level_progress = supabase.table('code_quest_level_progress')\
            .select('completed')\
            .eq('user_id', user_id)\
            .eq('tier', submission.tier)\
            .eq('level', submission.level)\
            .execute()

        is_replay = level_progress.data and level_progress.data[0]['completed']

        # Calculate XP
        base_xp = q['xp_base']

        # Apply replay penalty (50% XP)
        if is_replay:
            base_xp = int(base_xp * 0.5)

        speed_multiplier = 1.0
        # Speed bonus
        if submission.time_taken < 3:
            speed_multiplier = 1.5
        elif submission.time_taken < 5:
            speed_multiplier = 1.25

        # Final XP (combo multiplier applied on frontend)
        xp_earned = int(base_xp * speed_multiplier) if is_correct else 0

        # Award XP
        xp_result = None
        if xp_earned > 0:
            xp_result = supabase.rpc('award_cq_xp', {
                'p_user_id': user_id,
                'p_xp': xp_earned,
                'p_session_id': submission.session_id
            }).execute()

        # Update topic mastery
        for topic in q['topics']:
            supabase.rpc('update_topic_mastery', {
                'p_user_id': user_id,
                'p_topic': topic,
                'p_correct': is_correct
            }).execute()

        # Record answer with attempt tracking
        supabase.table('code_quest_user_answers').insert({
            'user_id': user_id,
            'session_id': submission.session_id,
            'question_id': submission.question_id,
            'user_answer': submission.user_answer,
            'correct': is_correct,
            'time_taken': submission.time_taken,
            'xp_earned': xp_earned,
            'attempt_number': submission.attempt_number,
            'tier': submission.tier,
            'level': submission.level,
            'is_replay': is_replay
        }).execute()

        return {
            'correct': is_correct,
            'xp_earned': xp_earned,
            'base_xp': base_xp,
            'speed_multiplier': speed_multiplier,
            'correct_answer': q['correct'],
            'explanation': q['explanation'],
            'is_replay': is_replay,
            'leveled_up': xp_result.data['leveled_up'] if xp_result and xp_result.data else False,
            'new_level': xp_result.data['new_level'] if xp_result and xp_result.data else None,
            'total_xp': xp_result.data['total_xp'] if xp_result and xp_result.data else None,
            'xp_to_next_level': xp_result.data.get('xp_to_next_level') if xp_result and xp_result.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/level/complete')
async def complete_level(
    completion: LevelComplete,
    current_user: dict = Depends(get_current_user)
):
    """
    Complete a level and check for unlocks (80% accuracy requirement).
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Calculate accuracy
        accuracy = (completion.questions_correct / completion.questions_answered * 100) if completion.questions_answered > 0 else 0

        # Update or create level progress
        existing = supabase.table('code_quest_level_progress')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('tier', completion.tier)\
            .eq('level', completion.level)\
            .execute()

        if existing.data:
            # Update existing progress
            current_best = existing.data[0].get('best_session_accuracy', 0)
            supabase.table('code_quest_level_progress')\
                .update({
                    'questions_answered': existing.data[0]['questions_answered'] + completion.questions_answered,
                    'questions_correct': existing.data[0]['questions_correct'] + completion.questions_correct,
                    'accuracy': accuracy,
                    'completed': True,
                    'best_session_accuracy': max(current_best, accuracy),
                    'first_completed_at': existing.data[0].get('first_completed_at') or datetime.now().isoformat(),
                    'last_played_at': datetime.now().isoformat()
                })\
                .eq('user_id', user_id)\
                .eq('tier', completion.tier)\
                .eq('level', completion.level)\
                .execute()
        else:
            # Create new progress record
            supabase.table('code_quest_level_progress').insert({
                'user_id': user_id,
                'tier': completion.tier,
                'level': completion.level,
                'questions_answered': completion.questions_answered,
                'questions_correct': completion.questions_correct,
                'accuracy': accuracy,
                'completed': True,
                'unlocked': True,
                'best_session_accuracy': accuracy,
                'first_completed_at': datetime.now().isoformat()
            }).execute()

        # Update best combo in global progress
        current_progress = supabase.table('code_quest_progress')\
            .select('best_combo')\
            .eq('user_id', user_id)\
            .execute()

        if current_progress.data:
            current_best_combo = current_progress.data[0]['best_combo']
            if completion.best_combo > current_best_combo:
                supabase.table('code_quest_progress')\
                    .update({'best_combo': completion.best_combo})\
                    .eq('user_id', user_id)\
                    .execute()

        # Update session
        supabase.table('code_quest_sessions')\
            .update({
                'questions_answered': completion.questions_answered,
                'questions_correct': completion.questions_correct,
                'best_combo': completion.best_combo,
                'completed_at': datetime.now().isoformat()
            })\
            .eq('id', completion.session_id)\
            .execute()

        # Check for unlocks (80% threshold)
        unlock_result = supabase.rpc('check_level_unlock', {
            'p_user_id': user_id,
            'p_tier': completion.tier,
            'p_level': completion.level,
            'p_accuracy': accuracy
        }).execute()

        return {
            'success': True,
            'accuracy': round(accuracy, 2),
            'passed': accuracy >= 80.0,
            'unlocks': unlock_result.data if unlock_result.data else {}
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing level: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/progress/levels')
async def get_level_progress(current_user: dict = Depends(get_current_user)):
    """Get user's level progress for all tiers/levels."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Get level progress
        levels = supabase.rpc('get_user_level_progress', {
            'p_user_id': user_id
        }).execute()

        # Get tier unlocks
        tiers = supabase.rpc('get_user_tier_unlocks', {
            'p_user_id': user_id
        }).execute()

        # Get overall progress
        overall = supabase.table('code_quest_progress')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        return {
            'levels': levels.data if levels.data else [],
            'tiers': tiers.data if tiers.data else [],
            'overall': overall.data[0] if overall.data else None
        }

    except Exception as e:
        print(f"Error fetching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/progress')
async def get_progress(current_user: dict = Depends(get_current_user)):
    """Get user's overall Code Quest progress (legacy endpoint)."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Initialize if needed
        progress = supabase.rpc('get_or_create_cq_progress', {'p_user_id': user_id}).execute()

        # Get topic mastery
        topics = supabase.table('code_quest_topic_mastery')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        # Get recent sessions
        sessions = supabase.table('code_quest_sessions')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('completed_at', desc=True)\
            .limit(10)\
            .execute()

        # Extract progress data
        prog_data = progress.data if progress.data else {}

        # Return flattened format for frontend compatibility
        return {
            'total_xp': prog_data.get('total_xp', 0),
            'level': prog_data.get('level', 1),
            'current_streak': prog_data.get('current_streak', 0),
            'best_streak': prog_data.get('best_streak', 0),
            'best_combo': prog_data.get('best_combo', 0),
            'topic_mastery': topics.data,
            'recent_sessions': sessions.data
        }

    except Exception as e:
        print(f"Error fetching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/leaderboard')
async def get_leaderboard(
    mode: str = 'quest',  # 'quest' or 'timeattack'
    tier: Optional[int] = None,
    limit: int = 50
):
    """Get Code Quest leaderboard."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        # Use main leaderboard for now
        result = supabase.from_('code_quest_leaderboard')\
            .select('*')\
            .limit(limit)\
            .execute()

        return {
            'game_id': 'codequest',
            'mode': mode,
            'leaderboard': result.data
        }

    except Exception as e:
        print(f"Error fetching leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/stats')
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get detailed stats for analytics dashboard."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Get progress
        progress = supabase.table('code_quest_progress').select('*').eq('user_id', user_id).execute()

        # Get all answers for analytics
        answers = supabase.table('code_quest_user_answers')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('answered_at', desc=True)\
            .limit(100)\
            .execute()

        # Get total sessions
        sessions_count = len(
            supabase.table('code_quest_sessions')\
            .select('id')\
            .eq('user_id', user_id)\
            .execute().data
        )

        return {
            'progress': progress.data[0] if progress.data else None,
            'recent_answers': answers.data,
            'total_sessions': sessions_count
        }

    except Exception as e:
        print(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
