"""
SYNTH AI - Q&A Endpoint

Terminal `ask` command - answer any question with SYNTH personality.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from api.services.conversation_service import ConversationService
from api.services.rate_limit_service import RateLimitService
from api.services.usage_tracker import UsageTracker
from api.utils.auth import get_user_from_token

router = APIRouter()

# Initialize services
try:
    conversation = ConversationService()
    rate_limiter = RateLimitService()
    tracker = UsageTracker()
except Exception as e:
    print(f"⚠️ SYNTH services initialization error: {e}")
    conversation = None
    rate_limiter = None
    tracker = None


class AskRequest(BaseModel):
    """Request model for Q&A."""
    question: str


class AskResponse(BaseModel):
    """Response model for Q&A."""
    response: str
    remaining: int
    search_results: Optional[list] = None  # SYNTH search results (if any)


@router.post('/ask', response_model=AskResponse)
async def ask_synth(
    request: AskRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Ask SYNTH anything - get answers with 80s personality.

    Requires authentication. Rate limited to 50/day per user.
    """
    # Check if services are initialized
    if not conversation or not rate_limiter or not tracker:
        raise HTTPException(
            status_code=503,
            detail="SYNTH is temporarily offline. Check configuration."
        )

    # Check authentication
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Sign in to chat with SYNTH."
        )

    # Validate question
    if not request.question or len(request.question.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="Question too short. Ask SYNTH something!"
        )

    if len(request.question) > 500:
        raise HTTPException(
            status_code=400,
            detail="Question too long. Keep it under 500 characters."
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

    # Use new ConversationService to handle query with user context
    try:
        result = await conversation.handle_query(request.question, user_id=user_id)

        response_text = result.get('commentary') or result.get('response', 'No response generated')
        search_results = result.get('results', [])

        # Log usage
        try:
            tracker.log_usage(user_id, 'ask', tokens_used=200)
        except Exception as e:
            print(f"Tracking error: {e}")

        return AskResponse(
            response=response_text,
            remaining=max(0, user_limit['remaining'] - 1),
            search_results=search_results
        )

    except Exception as e:
        print(f"❌ Ask endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"SYNTH encountered an error: {str(e)}"
        )


@router.post('/explain', response_model=AskResponse)
async def explain_concept(
    request: AskRequest,  # Reuse same model, just different field name semantically
    authorization: Optional[str] = Header(None)
):
    """
    Ask SYNTH to explain a concept or topic.

    Requires authentication. Rate limited to 50/day per user.
    """
    # Check if services are initialized
    if not conversation or not rate_limiter or not tracker:
        raise HTTPException(
            status_code=503,
            detail="SYNTH is temporarily offline."
        )

    # Check authentication
    user_id = get_user_from_token(authorization)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    # Validate topic
    if not request.question or len(request.question.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Topic too short."
        )

    # Check rate limits
    try:
        user_limit = rate_limiter.check_user_limit(user_id)
        if not user_limit['allowed']:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached. SYNTH needs to recharge!"
            )

        if not rate_limiter.check_global_limit():
            raise HTTPException(
                status_code=503,
                detail="Service capacity reached."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Rate limit error: {e}")

    # Generate explanation
    try:
        result = await conversation.handle_query(f"Explain: {request.question}")
        response = result.get('commentary') or result.get('response', 'No explanation generated')

        # Log usage
        try:
            tracker.log_usage(user_id, 'explain', tokens_used=250)
        except Exception as e:
            print(f"Tracking error: {e}")

        return AskResponse(
            response=response,
            remaining=max(0, user_limit['remaining'] - 1)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"SYNTH encountered an error: {str(e)}"
        )
