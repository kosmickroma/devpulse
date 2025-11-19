"""
SYNTH AI - Smart Search Endpoint

Natural language search across GitHub, HackerNews, and Dev.to.
Example: "find arcade games on github" or "show me rust tutorials"
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from api.services.synth_search_service_v2 import SynthSearchServiceV2 as SynthSearchService
from api.services.rate_limit_service import RateLimitService
from api.services.usage_tracker import UsageTracker
from api.utils.auth import get_user_from_token

router = APIRouter()

# Initialize services
try:
    search_service = SynthSearchService()
    rate_limiter = RateLimitService()
    tracker = UsageTracker()
except Exception as e:
    print(f"⚠️ SYNTH search services initialization error: {e}")
    search_service = None
    rate_limiter = None
    tracker = None


class SearchRequest(BaseModel):
    """Request model for AI-powered search."""
    query: str


class SearchResponse(BaseModel):
    """Response model for search results."""
    query: str
    intent: Dict[str, Any]
    results: List[Dict[str, Any]]
    total_found: int
    commentary: str
    remaining: int
    errors: Optional[List[str]] = None


@router.post('/search', response_model=SearchResponse)
async def search_content(
    request: SearchRequest,
    authorization: Optional[str] = Header(None)
):
    """
    AI-powered search across all DevPulse sources.

    SYNTH understands natural language queries like:
    - "find cool arcade games on github"
    - "show me python machine learning repos"
    - "search for react tutorials on dev.to"
    - "what's trending on hacker news about AI"

    Requires authentication. Rate limited to 50/day per user.
    """
    # Check if services are initialized
    if not search_service or not rate_limiter or not tracker:
        raise HTTPException(
            status_code=503,
            detail="Search service temporarily offline. Check configuration."
        )

    # Check authentication
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Sign in to use SYNTH search."
        )

    # Validate query
    if not request.query or len(request.query.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="Search query too short. Tell SYNTH what you're looking for!"
        )

    if len(request.query) > 200:
        raise HTTPException(
            status_code=400,
            detail="Query too long. Keep it under 200 characters."
        )

    # Check rate limits
    try:
        user_limit = rate_limiter.check_user_limit(user_id)
        if not user_limit['allowed']:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached ({user_limit['limit']} queries/day). SYNTH needs to recharge!"
            )

        if not rate_limiter.check_global_limit():
            raise HTTPException(
                status_code=503,
                detail="SYNTH is overloaded. Try again later!"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Rate limit error: {e}")

    # Execute search
    try:
        search_results = await search_service.search(request.query)

        # Log usage
        try:
            tracker.log_usage(user_id, 'search', tokens_used=250)
        except Exception as e:
            print(f"Tracking error: {e}")

        return SearchResponse(
            query=search_results['query'],
            intent=search_results['intent'],
            results=search_results['results'],
            total_found=search_results['total_found'],
            commentary=search_results['commentary'],
            remaining=max(0, user_limit['remaining'] - 1),
            errors=search_results.get('errors')
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"SYNTH search error: {str(e)}"
        )
