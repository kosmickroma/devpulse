"""
User profile management endpoints for DevPulse.
Handles username changes, profile retrieval, and user settings.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import Optional
from supabase import create_client, Client
import os
import re
from api.utils.auth import get_current_user

router = APIRouter()

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase env vars not set for profile features")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class UsernameUpdate(BaseModel):
    username: str

    @validator('username')
    def validate_username(cls, v):
        # Strip whitespace
        v = v.strip()

        # Length check: 3-20 characters
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 20:
            raise ValueError('Username must be 20 characters or less')

        # Format check: alphanumeric + underscores only
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')

        # Cannot start with underscore
        if v.startswith('_'):
            raise ValueError('Username cannot start with an underscore')

        return v


@router.get('/me')
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's full profile including username, XP, level, and equipped badge.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Profile features not configured")

    try:
        user_id = current_user['id']
        print(f"[Profile] Fetching profile for user {user_id}")

        # Get user profile (username)
        profile = supabase.table('user_profiles')\
            .select('*')\
            .eq('id', user_id)\
            .execute()

        # Get arcade profile (XP, level)
        arcade_profile = supabase.table('user_arcade_profile')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()

        # Get equipped badge
        equipped_badge = supabase.table('user_badges')\
            .select('*, badges(*)')\
            .eq('user_id', user_id)\
            .eq('is_equipped', True)\
            .execute()

        return {
            'user_id': user_id,
            'username': profile.data[0]['username'] if profile.data else None,
            'arcade_profile': arcade_profile.data[0] if arcade_profile.data else None,
            'equipped_badge': equipped_badge.data[0] if equipped_badge.data else None
        }

    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/username')
async def update_username(
    update: UsernameUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's display username.
    Validates uniqueness, length, and format.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Profile features not configured")

    try:
        user_id = current_user['id']
        new_username = update.username
        print(f"[Profile] User {user_id} attempting to change username to: {new_username}")

        # Check if username is already taken
        existing = supabase.table('user_profiles')\
            .select('id')\
            .eq('username', new_username)\
            .execute()

        if existing.data and existing.data[0]['id'] != user_id:
            raise HTTPException(status_code=409, detail="Username already taken")

        # Update username in user_profiles
        result = supabase.table('user_profiles')\
            .update({'username': new_username})\
            .eq('id', user_id)\
            .execute()

        print(f"[Profile] Username updated successfully: {result.data}")

        return {
            'success': True,
            'username': new_username,
            'message': 'Username updated successfully'
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating username: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/check-username/{username}')
async def check_username_availability(username: str):
    """
    Check if a username is available (not taken by another user).
    Public endpoint for real-time validation.
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Profile features not configured")

    try:
        # Validate format first
        try:
            UsernameUpdate(username=username)
        except ValueError as e:
            return {
                'available': False,
                'reason': str(e)
            }

        # Check if taken
        existing = supabase.table('user_profiles')\
            .select('user_id')\
            .eq('username', username)\
            .execute()

        is_available = len(existing.data) == 0

        return {
            'available': is_available,
            'reason': None if is_available else 'Username already taken'
        }

    except Exception as e:
        print(f"Error checking username: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/{user_id}')
async def get_user_profile(user_id: str):
    """
    Get public profile for any user (for displaying on leaderboards, etc.).
    """
    if supabase is None:
        raise HTTPException(status_code=503, detail="Profile features not configured")

    try:
        # Get user profile
        profile = supabase.table('user_profiles')\
            .select('username')\
            .eq('id', user_id)\
            .execute()

        # Get equipped badge
        equipped_badge = supabase.table('user_badges')\
            .select('*, badges(*)')\
            .eq('user_id', user_id)\
            .eq('is_equipped', True)\
            .execute()

        if not profile.data:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            'user_id': user_id,
            'username': profile.data[0]['username'],
            'equipped_badge': equipped_badge.data[0] if equipped_badge.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
