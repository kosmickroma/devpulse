from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from supabase import create_client, Client
import os
from api.utils.auth import get_current_user

router = APIRouter()

# Supabase client - initialize only if env vars are set
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set for arcade features to work")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ScoreSubmission(BaseModel):
    game_id: str
    score: int
    metadata: Optional[Dict[str, Any]] = None

class LeaderboardQuery(BaseModel):
    game_id: str
    limit: int = 50

# XP rewards based on game completion
GAME_XP_REWARDS = {
    # Arcade games
    'snake': 75,
    'spaceinvaders': 150,
    'minesweeper': 100,
    # Vault games
    'guess': 50,
    'bagels': 75,
    'nim': 100,
    'amazing': 100,
    'stock': 150,
    'oregon': 150,
    'startrek': 200
}

@router.post('/submit-score')
async def submit_score(submission: ScoreSubmission, current_user: dict = Depends(get_current_user)):
    """
    Submit a score for a game.
    Awards XP automatically and updates leaderboard.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Arcade features not configured")

    try:
        user_id = current_user['id']
        print(f"[Score Submit] User {user_id} submitting {submission.game_id}: {submission.score}")

        # Check if this is a new high score
        existing = supabase.table('game_high_scores').select('score').eq('user_id', user_id).eq('game_id', submission.game_id).execute()
        print(f"[Score Submit] Existing record: {existing.data}")

        is_new_high_score = False
        xp_to_award = 0

        if not existing.data:
            # First time playing this game
            is_new_high_score = True
            xp_to_award = GAME_XP_REWARDS.get(submission.game_id, 50)  # Default 50 XP
            print(f"[Score Submit] First time playing! XP: {xp_to_award}")
        elif existing.data[0]['score'] < submission.score:
            # Beat previous high score
            is_new_high_score = True
            xp_to_award = 25  # Bonus XP for beating personal best
            print(f"[Score Submit] Beat high score! Old: {existing.data[0]['score']}, New: {submission.score}")

        # Insert or update high score
        score_data = {
            'user_id': user_id,
            'game_id': submission.game_id,
            'score': submission.score,
            'metadata': submission.metadata or {}
        }

        print(f"[Score Submit] Upserting score: {score_data}")
        result = supabase.table('game_high_scores').upsert(score_data, on_conflict='user_id,game_id').execute()
        print(f"[Score Submit] Upsert result: {result.data}")

        # Award XP if earned
        if xp_to_award > 0:
            reason = 'first_play' if not existing.data else 'high_score_beat'
            supabase.rpc('award_xp', {
                'p_user_id': user_id,
                'p_amount': xp_to_award,
                'p_reason': reason,
                'p_game_id': submission.game_id
            }).execute()

        # Check if user is top 10 globally
        leaderboard = supabase.table('leaderboard').select('rank').eq('user_id', user_id).eq('game_id', submission.game_id).execute()

        global_rank = None
        if leaderboard.data:
            global_rank = leaderboard.data[0]['rank']

            # Bonus XP for top placements
            if global_rank == 1:
                supabase.rpc('award_xp', {
                    'p_user_id': user_id,
                    'p_amount': 100,
                    'p_reason': 'rank_1_global',
                    'p_game_id': submission.game_id
                }).execute()
                xp_to_award += 100
            elif global_rank <= 10:
                supabase.rpc('award_xp', {
                    'p_user_id': user_id,
                    'p_amount': 50,
                    'p_reason': 'top_10_global',
                    'p_game_id': submission.game_id
                }).execute()
                xp_to_award += 50

        return {
            'success': True,
            'is_new_high_score': is_new_high_score,
            'xp_awarded': xp_to_award,
            'global_rank': global_rank,
            'score': submission.score
        }

    except Exception as e:
        print(f"Error submitting score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/leaderboard/{game_id}')
async def get_leaderboard(game_id: str, limit: int = 50):
    """
    Get global leaderboard for a specific game.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Arcade features not configured")

    try:
        result = supabase.table('leaderboard')\
            .select('rank, username, score, achieved_at, metadata')\
            .eq('game_id', game_id)\
            .order('rank')\
            .limit(limit)\
            .execute()

        return {
            'game_id': game_id,
            'leaderboard': result.data
        }

    except Exception as e:
        print(f"Error fetching leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/profile')
async def get_arcade_profile(current_user: dict = Depends(get_current_user)):
    """
    Get user's arcade profile including XP, level, and badges.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Arcade features not configured")

    try:
        user_id = current_user['id']

        # Get or create profile
        profile = supabase.table('user_arcade_profile').select('*').eq('user_id', user_id).execute()

        if not profile.data:
            # Create new profile
            new_profile = {
                'user_id': user_id,
                'total_xp': 0,
                'level': 1,
                'is_early_explorer': True,  # Mark as early explorer
                'early_explorer_granted_at': 'now()'
            }
            profile = supabase.table('user_arcade_profile').insert(new_profile).execute()

        # Get user's high scores
        high_scores = supabase.table('game_high_scores').select('game_id, score, achieved_at').eq('user_id', user_id).execute()

        # Get user's leaderboard ranks
        ranks = supabase.table('leaderboard').select('game_id, rank').eq('user_id', user_id).execute()

        return {
            'profile': profile.data[0] if profile.data else None,
            'high_scores': high_scores.data,
            'ranks': {r['game_id']: r['rank'] for r in ranks.data} if ranks.data else {}
        }

    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/high-scores')
async def get_all_high_scores(current_user: dict = Depends(get_current_user)):
    """
    Get all high scores for current user across all games.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Arcade features not configured")

    try:
        user_id = current_user['id']

        result = supabase.table('game_high_scores')\
            .select('game_id, score, achieved_at, metadata')\
            .eq('user_id', user_id)\
            .execute()

        return {
            'high_scores': result.data
        }

    except Exception as e:
        print(f"Error fetching high scores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/all-leaderboards')
async def get_all_leaderboards(limit: int = 10):
    """
    Get top players across all games.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Arcade features not configured")

    try:
        # Get unique game IDs
        games = ['snake', 'spaceinvaders', 'minesweeper', 'guess', 'bagels', 'nim', 'amazing', 'stock', 'oregon', 'startrek']

        all_leaderboards = {}
        for game_id in games:
            result = supabase.table('leaderboard')\
                .select('rank, username, score, achieved_at')\
                .eq('game_id', game_id)\
                .order('rank')\
                .limit(limit)\
                .execute()

            all_leaderboards[game_id] = result.data

        return {
            'leaderboards': all_leaderboards
        }

    except Exception as e:
        print(f"Error fetching all leaderboards: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
