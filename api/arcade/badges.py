"""
Badge system endpoints for DevPulse Arcade.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
import os
from api.utils.auth import get_current_user

router = APIRouter()

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase env vars not set for badge features")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class BadgeEquipRequest(BaseModel):
    badge_id: str
    is_equipped: bool


@router.get('/all')
async def get_all_badges():
    """Get all available badges."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Badge system not configured")

    try:
        result = supabase.table('badges').select('*').execute()
        return {'badges': result.data}
    except Exception as e:
        print(f"Error fetching badges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/user')
async def get_user_badges(current_user: dict = Depends(get_current_user)):
    """Get all badges for the current user."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Badge system not configured")

    try:
        user_id = current_user['id']

        # Get user's badges with badge details
        result = supabase.table('user_badges')\
            .select('*, badges(*)')\
            .eq('user_id', user_id)\
            .execute()

        return {
            'badges': result.data,
            'count': len(result.data)
        }
    except Exception as e:
        print(f"Error fetching user badges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/new')
async def check_new_badges(current_user: dict = Depends(get_current_user)):
    """
    Check if user has any newly unlocked badges that haven't been seen.
    Returns badges unlocked in the last 60 seconds.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Badge system not configured")

    try:
        user_id = current_user['id']

        # Get badges unlocked in last 60 seconds
        result = supabase.table('user_badges')\
            .select('*, badges(*)')\
            .eq('user_id', user_id)\
            .gte('unlocked_at', 'now() - interval \'60 seconds\'')\
            .execute()

        return {
            'new_badges': result.data,
            'has_new': len(result.data) > 0
        }
    except Exception as e:
        print(f"Error checking new badges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/equip')
async def equip_badge(
    request: BadgeEquipRequest,
    current_user: dict = Depends(get_current_user)
):
    """Equip or unequip a badge."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Badge system not configured")

    try:
        user_id = current_user['id']

        # Verify user owns this badge
        check = supabase.table('user_badges')\
            .select('id')\
            .eq('user_id', user_id)\
            .eq('badge_id', request.badge_id)\
            .execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="Badge not found or not owned")

        # If equipping, unequip all other badges first (only one equipped at a time)
        if request.is_equipped:
            supabase.table('user_badges')\
                .update({'is_equipped': False})\
                .eq('user_id', user_id)\
                .execute()

        # Update the badge
        result = supabase.table('user_badges')\
            .update({'is_equipped': request.is_equipped})\
            .eq('user_id', user_id)\
            .eq('badge_id', request.badge_id)\
            .execute()

        return {
            'success': True,
            'badge_id': request.badge_id,
            'is_equipped': request.is_equipped
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error equipping badge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/equipped/{user_id}')
async def get_equipped_badge(user_id: str):
    """Get the equipped badge for a specific user (for displaying on leaderboard)."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Badge system not configured")

    try:
        result = supabase.table('user_badges')\
            .select('*, badges(*)')\
            .eq('user_id', user_id)\
            .eq('is_equipped', True)\
            .execute()

        if result.data:
            return {'badge': result.data[0]}
        else:
            return {'badge': None}
    except Exception as e:
        print(f"Error fetching equipped badge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
