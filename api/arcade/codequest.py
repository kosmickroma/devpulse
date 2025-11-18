"""
Python Code Quest API endpoints.
Handles questions, answers, progress tracking, and streak management.
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


class AnswerSubmission(BaseModel):
    question_id: str
    user_answer: str  # A, B, C, or D
    time_taken: float  # seconds
    session_id: Optional[str] = None


class SessionComplete(BaseModel):
    session_id: str
    questions_answered: int
    questions_correct: int
    best_combo: int
    avg_speed: float


@router.get('/question/random')
async def get_random_question(
    difficulty: Optional[int] = None,
    topic: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a random question based on user's level and preferences.
    Uses adaptive difficulty selection.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Get or create user progress
        progress = supabase.rpc('get_or_create_cq_progress', {'p_user_id': user_id}).execute()

        # Debug logging
        print(f"DEBUG: RPC response - data: {progress.data}")

        # Handle RPC response - it returns a dict, not a list
        user_level = progress.data['level'] if progress.data else 1
        user_tier = progress.data['current_tier'] if progress.data else 1

        print(f"DEBUG: User level={user_level}, tier={user_tier}")

        # Build query
        query = supabase.table('code_quest_questions').select('*')

        # Filter by difficulty if specified, otherwise use adaptive selection
        if difficulty:
            query = query.eq('difficulty', difficulty)
        else:
            # Adaptive difficulty: Use range instead of exact match for better question availability
            # Target difficulty based on user level but with flexibility
            rand = random.random()
            if rand < 0.70:
                target_difficulty = user_level
            elif rand < 0.85:
                target_difficulty = min(user_level + 1, 10)
            elif rand < 0.95:
                target_difficulty = max(user_level - 1, 1)
            else:
                target_difficulty = random.randint(1, 10)

            # Use range query to find questions within ±2 levels for better availability
            query = query.gte('difficulty', max(1, target_difficulty - 2)).lte('difficulty', min(10, target_difficulty + 2))

        # Filter by topic if specified
        if topic:
            query = query.contains('topics', [topic])

        # Filter by tier (don't show questions way above user's level)
        query = query.lte('tier', user_tier + 1)

        # Execute query
        result = query.execute()

        print(f"DEBUG: Query found {len(result.data) if result.data else 0} questions")
        print(f"DEBUG: Filters - difficulty={target_difficulty if not difficulty else difficulty}, tier<={user_tier + 1}")

        if not result.data:
            raise HTTPException(status_code=404, detail=f"No questions found matching criteria (difficulty={target_difficulty if not difficulty else difficulty}, tier<={user_tier + 1})")

        # Select random question from results
        question = random.choice(result.data)

        # Remove correct answer from response (security)
        response_question = {
            'id': question['id'],
            'type': question['type'],
            'difficulty': question['difficulty'],
            'tier': question['tier'],
            'topics': question['topics'],
            'code': question.get('code'),
            'question': question['question'],
            'options': question['options'],
            'hint': question.get('hint'),
            'time_limit': question['time_limit']
        }

        return response_question

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching random question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/answer')
async def submit_answer(
    submission: AnswerSubmission,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit an answer and receive instant feedback with XP calculation.
    Handles combo multipliers, speed bonuses, and streak tracking.
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
        is_correct = submission.user_answer.upper() == q['correct'].upper()

        # Calculate XP
        base_xp = q['xp_base']
        speed_multiplier = 1.0

        # Speed bonus
        if submission.time_taken < 3:
            speed_multiplier = 1.5  # +50% for lightning fast
        elif submission.time_taken < 5:
            speed_multiplier = 1.25  # +25% for fast

        # Calculate final XP (combo multiplier will be applied on frontend based on streak)
        xp_earned = int(base_xp * speed_multiplier) if is_correct else 0

        # Award XP (this also updates global DevPulse XP!)
        if xp_earned > 0:
            xp_result = supabase.rpc('award_cq_xp', {
                'p_user_id': user_id,
                'p_xp': xp_earned,
                'p_session_id': submission.session_id
            }).execute()
        else:
            xp_result = None

        # Update topic mastery for all topics in question
        for topic in q['topics']:
            supabase.rpc('update_topic_mastery', {
                'p_user_id': user_id,
                'p_topic': topic,
                'p_correct': is_correct
            }).execute()

        # Record answer
        supabase.table('code_quest_user_answers').insert({
            'user_id': user_id,
            'session_id': submission.session_id,
            'question_id': submission.question_id,
            'user_answer': submission.user_answer,
            'correct': is_correct,
            'time_taken': submission.time_taken,
            'xp_earned': xp_earned
        }).execute()

        # Update progress counters
        supabase.table('code_quest_progress')\
            .update({
                'total_questions_answered': supabase.table('code_quest_progress').select('total_questions_answered').eq('user_id', user_id).execute().data[0]['total_questions_answered'] + 1 if supabase.table('code_quest_progress').select('total_questions_answered').eq('user_id', user_id).execute().data else 1,
                'total_correct': supabase.table('code_quest_progress').select('total_correct').eq('user_id', user_id).execute().data[0]['total_correct'] + (1 if is_correct else 0) if supabase.table('code_quest_progress').select('total_correct').eq('user_id', user_id).execute().data else (1 if is_correct else 0)
            })\
            .eq('user_id', user_id)\
            .execute()

        return {
            'correct': is_correct,
            'xp_earned': xp_earned,
            'base_xp': base_xp,
            'speed_multiplier': speed_multiplier,
            'correct_answer': q['correct'],
            'explanation': q['explanation'],
            'leveled_up': xp_result.data['leveled_up'] if xp_result and xp_result.data else False,
            'new_level': xp_result.data['new_level'] if xp_result and xp_result.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/progress')
async def get_progress(current_user: dict = Depends(get_current_user)):
    """Get user's Code Quest progress including XP, level, streak, and topic mastery."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Get or create progress
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

        return {
            'progress': progress.data[0] if progress.data else None,
            'topic_mastery': topics.data,
            'recent_sessions': sessions.data
        }

    except Exception as e:
        print(f"Error fetching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/session/start')
async def start_session(current_user: dict = Depends(get_current_user)):
    """Start a new Code Quest session and update streak."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Update streak
        supabase.rpc('update_cq_streak', {'p_user_id': user_id}).execute()

        # Create session record
        session = supabase.table('code_quest_sessions').insert({
            'user_id': user_id,
            'questions_answered': 0,
            'questions_correct': 0,
            'xp_earned': 0
        }).execute()

        # Get updated progress with new streak
        progress = supabase.table('code_quest_progress')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        return {
            'session_id': session.data[0]['id'],
            'current_streak': progress.data[0]['current_streak'] if progress.data else 1,
            'longest_streak': progress.data[0]['longest_streak'] if progress.data else 1
        }

    except Exception as e:
        print(f"Error starting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/session/complete')
async def complete_session(
    completion: SessionComplete,
    current_user: dict = Depends(get_current_user)
):
    """Mark session as complete and check for badge unlocks."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        user_id = current_user['id']

        # Update session
        perfect = completion.questions_correct == completion.questions_answered and completion.questions_answered > 0

        supabase.table('code_quest_sessions')\
            .update({
                'questions_answered': completion.questions_answered,
                'questions_correct': completion.questions_correct,
                'best_combo': completion.best_combo,
                'avg_speed': completion.avg_speed,
                'perfect_session': perfect,
                'completed_at': datetime.now().isoformat()
            })\
            .eq('id', completion.session_id)\
            .execute()

        # Update user's best combo
        supabase.table('code_quest_progress')\
            .update({
                'best_combo': supabase.table('code_quest_progress').select('best_combo').eq('user_id', user_id).execute().data[0]['best_combo'] if supabase.table('code_quest_progress').select('best_combo').eq('user_id', user_id).execute().data and supabase.table('code_quest_progress').select('best_combo').eq('user_id', user_id).execute().data[0]['best_combo'] > completion.best_combo else completion.best_combo
            })\
            .eq('user_id', user_id)\
            .execute()

        # Check for badge unlocks
        badges_to_unlock = []

        # Get current progress
        progress = supabase.table('code_quest_progress').select('*').eq('user_id', user_id).execute()
        if progress.data:
            p = progress.data[0]

            # Python Prodigy - Level 10
            if p['level'] >= 10:
                badges_to_unlock.append('python_prodigy')

            # Streak Legend - 100 day streak
            if p['current_streak'] >= 100:
                badges_to_unlock.append('streak_legend')

        # Grant badges
        for badge_id in badges_to_unlock:
            try:
                supabase.rpc('grant_badge', {
                    'p_user_id': user_id,
                    'p_badge_id': badge_id,
                    'p_metadata': {'granted_from': 'code_quest'}
                }).execute()
            except:
                pass  # Badge already granted

        return {
            'success': True,
            'perfect_session': perfect,
            'badges_unlocked': badges_to_unlock
        }

    except Exception as e:
        print(f"Error completing session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/leaderboard')
async def get_leaderboard(limit: int = 50):
    """Get Code Quest leaderboard (integrated with main arcade leaderboard)."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Code Quest not configured")

    try:
        result = supabase.from_('code_quest_leaderboard')\
            .select('*')\
            .limit(limit)\
            .execute()

        return {
            'game_id': 'codequest',
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

        # Calculate accuracy by question type
        # (Would need to join with questions table for full stats)

        return {
            'progress': progress.data[0] if progress.data else None,
            'recent_answers': answers.data,
            'total_sessions': len(supabase.table('code_quest_sessions').select('id').eq('user_id', user_id).execute().data)
        }

    except Exception as e:
        print(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
