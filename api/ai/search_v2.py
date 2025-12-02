"""
SYNTH AI v2 - Multi-Agent Search Endpoint

Enhanced search with multi-agent orchestration:
- ConversationAgent: Handles vague/ambiguous queries
- CodeAgent: Specialized for GitHub/technical queries
- SearchAgent: Fast multi-source search

Backward compatible with v1 but provides enhanced intelligence.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from api.services.synth_v2_service import SynthV2Service
from api.services.rate_limit_service import RateLimitService
from api.services.usage_tracker import UsageTracker
from api.utils.auth import get_user_from_token

router = APIRouter()

# Initialize services
try:
    synth_v2_service = SynthV2Service()
    rate_limiter = RateLimitService()
    tracker = UsageTracker()
    print("✅ SYNTH v2 endpoint initialized")
except Exception as e:
    print(f"⚠️ SYNTH v2 initialization error: {e}")
    synth_v2_service = None
    rate_limiter = None
    tracker = None


class SearchV2Request(BaseModel):
    """Request model for v2 search."""
    query: str
    skip_search: Optional[bool] = False  # If true, only returns agent response


class SearchV2Response(BaseModel):
    """Response model for v2 search."""
    mode: str  # 'conversation' or 'search'
    query: str
    agent: Dict[str, Any]  # Agent insights
    routing: Dict[str, Any]  # Routing decision
    results: Optional[List[Dict[str, Any]]] = None  # Search results (if mode=search)
    commentary: Optional[str] = None  # AI commentary (if mode=search)
    sources: Optional[List[str]] = None  # Sources searched
    intent: Optional[Dict[str, Any]] = None  # Intent classification
    timing: Dict[str, Any]  # Performance metrics
    remaining: int  # Remaining queries


@router.post('/v2/search', response_model=SearchV2Response)
async def search_v2(
    request: SearchV2Request,
    authorization: Optional[str] = Header(None)
):
    """
    SYNTH v2 - Multi-Agent Intelligent Search

    Enhanced search with specialized agents:

    **ConversationAgent** (Claude 3.5 Haiku):
    - "I want to learn something new" → Asks clarifying questions
    - "help me find..." → Guides you to specific resources
    - Handles vague/ambiguous queries

    **CodeAgent** (GPT-4o mini):
    - "AI projects with 1000+ stars using transformers on github"
    - "python machine learning repos"
    - Specialized for GitHub/technical queries

    **SearchAgent** (Gemini 2.5 Flash):
    - "show me news on reddit about AI"
    - "trending games on IGN"
    - Fast multi-source search

    The system intelligently routes your query to the best agent,
    then executes searches across recommended sources.

    Requires authentication. Rate limited to 50/day per user.
    """
    # Check if services are initialized
    if not synth_v2_service or not rate_limiter or not tracker:
        raise HTTPException(
            status_code=503,
            detail="SYNTH v2 service temporarily offline. Check configuration."
        )

    # Check authentication
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Sign in to use SYNTH v2."
        )

    # Validate query
    if not request.query or len(request.query.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="Search query too short. Tell SYNTH what you're looking for!"
        )

    if len(request.query) > 300:
        raise HTTPException(
            status_code=400,
            detail="Query too long. Keep it under 300 characters."
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

    # Execute v2 search
    try:
        result = await synth_v2_service.search(
            query=request.query,
            skip_search=request.skip_search
        )

        # Log usage with agent type
        try:
            agent_type = result.get('agent', {}).get('type', 'unknown')
            mode = result.get('mode', 'search')
            tracker.log_usage(user_id, f"v2_{mode}_{agent_type}", tokens_used=500)
        except Exception as e:
            print(f"Tracking error: {e}")

        # Build response based on mode
        return SearchV2Response(
            mode=result['mode'],
            query=result['query'],
            agent=result.get('agent', {}),
            routing=result.get('routing', {}),
            results=result.get('results'),
            commentary=result.get('commentary'),
            sources=result.get('sources'),
            intent=result.get('intent'),
            timing=result.get('timing', {}),
            remaining=max(0, user_limit['remaining'] - 1)
        )

    except Exception as e:
        print(f"❌ SYNTH v2 error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"SYNTH v2 error: {str(e)}"
        )


@router.get('/v2/health')
async def health_check():
    """
    Health check for SYNTH v2 service.

    Returns service status and agent availability.
    """
    if not synth_v2_service:
        raise HTTPException(
            status_code=503,
            detail="SYNTH v2 service not initialized"
        )

    try:
        health = await synth_v2_service.get_health()
        return health
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )
