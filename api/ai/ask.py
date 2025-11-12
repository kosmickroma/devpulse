"""
SYNTH AI - Q&A Endpoint

Terminal `ask` command - answer any question with SYNTH personality.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from api.services.gemini_service import GeminiService
from api.services.rate_limit_service import RateLimitService
from api.services.usage_tracker import UsageTracker
from api.services.github_search_service import GitHubSearchService

router = APIRouter()

# Initialize services
try:
    gemini = GeminiService()
    rate_limiter = RateLimitService()
    tracker = UsageTracker()
    github_search = GitHubSearchService()
except Exception as e:
    print(f"⚠️ SYNTH services initialization error: {e}")
    gemini = None
    rate_limiter = None
    tracker = None
    github_search = None


class AskRequest(BaseModel):
    """Request model for Q&A."""
    question: str


class AskResponse(BaseModel):
    """Response model for Q&A."""
    response: str
    remaining: int
    search_results: Optional[list] = None  # SYNTH search results (if any)


def get_user_from_token(authorization: Optional[str]) -> Optional[str]:
    """Extract user ID from JWT token (placeholder)."""
    if not authorization:
        return None

    if authorization.startswith('Bearer '):
        return "authenticated"  # Placeholder

    return None


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
    if not gemini or not rate_limiter or not tracker:
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

    # Analyze query to see if we need to search
    try:
        analysis = gemini.analyze_query_with_functions(request.question)

        search_results = None
        response_text = None

        # Check if SYNTH determined search is needed
        if analysis.get('needs_search') and github_search:
            source = analysis.get('source', 'github')

            if source == 'github':
                # Extract search parameters
                query = analysis.get('query', request.question)
                print(f"🔍 SYNTH searching GitHub for: {query}")

                # Execute search
                results = github_search.search_repositories(
                    query=query,
                    min_stars=50,  # Lower threshold for more results
                    limit=10
                )

                if results:
                    # Generate response with real data
                    response_text = gemini.generate_response_with_data(
                        request.question,
                        results
                    )
                    search_results = results
                    print(f"✅ SYNTH found {len(results)} GitHub repos")
                else:
                    response_text = f"I searched GitHub for '{query}' but didn't find any repos matching that. Try a different search term?"
            else:
                # Other sources not implemented yet
                response_text = f"I can search {source}, but that's not wired up yet. Coming soon!"
        else:
            # No search needed, generate direct answer
            response_text = analysis.get('direct_answer') or gemini.generate_answer(request.question)

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
    if not gemini or not rate_limiter or not tracker:
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
        response = gemini.explain_concept(request.question)

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
