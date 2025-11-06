"""
SYNTH AI - Article Summarization Endpoint

Provides AI-powered summaries for articles with caching and rate limiting.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import hashlib
from datetime import datetime, timedelta

# Import services (will be initialized when router is included)
from api.services.gemini_service import GeminiService
from api.services.rate_limit_service import RateLimitService
from api.services.usage_tracker import UsageTracker

router = APIRouter()

# Initialize services
try:
    gemini = GeminiService()
    rate_limiter = RateLimitService()
    tracker = UsageTracker()
except Exception as e:
    print(f"⚠️ SYNTH services initialization error: {e}")
    gemini = None
    rate_limiter = None
    tracker = None


class SummarizeRequest(BaseModel):
    """Request model for article summarization."""
    url: str
    title: str
    content: str  # Article snippet/description


class SummarizeResponse(BaseModel):
    """Response model for summarization."""
    summary: str
    remaining: int
    cached: bool = False


def get_user_from_token(authorization: Optional[str]) -> Optional[str]:
    """
    Extract user ID from JWT token.

    For now, this is a placeholder. In production, you'd verify the JWT.
    """
    if not authorization:
        return None

    # TODO: Implement proper JWT verification with Supabase
    # For now, just check if token exists
    if authorization.startswith('Bearer '):
        return "authenticated"  # Placeholder

    return None


@router.post('/summarize', response_model=SummarizeResponse)
async def summarize_article(
    request: SummarizeRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Generate AI summary of an article.

    Requires authentication. Rate limited to 50/day per user.
    """
    # Check if services are initialized
    if not gemini or not rate_limiter or not tracker:
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Check GEMINI_API_KEY configuration."
        )

    # Check authentication
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in to use AI features."
        )

    # Check rate limits
    try:
        user_limit = rate_limiter.check_user_limit(user_id)
        if not user_limit['allowed']:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached ({user_limit['limit']} queries/day). Resets at midnight UTC."
            )

        if not rate_limiter.check_global_limit():
            raise HTTPException(
                status_code=503,
                detail="Service capacity reached. Please try again later."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Rate limit error: {e}")
        # Continue on error

    # Check cache first
    # TODO: Implement cache lookup from database

    # Generate summary
    try:
        summary = gemini.generate_summary(request.title, request.content)

        # Log usage
        try:
            tracker.log_usage(user_id, 'summary', tokens_used=150)
        except Exception as e:
            print(f"Tracking error: {e}")

        # TODO: Cache summary in database

        return SummarizeResponse(
            summary=summary,
            remaining=max(0, user_limit['remaining'] - 1),
            cached=False
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )
