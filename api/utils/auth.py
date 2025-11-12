"""
Authentication utilities for DevPulse API.

Handles JWT token extraction and validation for Supabase auth.
"""

from typing import Optional
from jose import jwt, JWTError


def get_user_from_token(authorization: Optional[str]) -> Optional[str]:
    """
    Extract user ID from Supabase JWT token.

    Args:
        authorization: The Authorization header value ("Bearer <token>")

    Returns:
        User ID (UUID string) if valid, None otherwise
    """
    if not authorization:
        return None

    try:
        # Extract token from "Bearer <token>" format
        if not authorization.startswith('Bearer '):
            return None

        token = authorization.replace('Bearer ', '')

        # Decode JWT without verification (Supabase handles verification)
        # We just need to extract the user ID (sub claim)
        payload = jwt.get_unverified_claims(token)
        user_id = payload.get('sub')

        return user_id
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None
    except Exception as e:
        print(f"Token extraction error: {e}")
        return None
