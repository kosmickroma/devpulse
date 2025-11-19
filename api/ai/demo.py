"""
SYNTH Demo Mode - Auto-play impressive searches

Showcases SYNTH capabilities with pre-cached searches.
Perfect for landing page idle state or demonstrations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import os
import json

router = APIRouter()

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️ Supabase not configured for demo mode")


class DemoQuery(BaseModel):
    """Demo query with cached results."""
    id: str
    query_text: str
    results: List[Dict[str, Any]]
    display_order: int


class DemoQueriesResponse(BaseModel):
    """List of demo queries."""
    queries: List[str]
    total: int


@router.get('/queries', response_model=DemoQueriesResponse)
async def get_demo_queries():
    """
    Get list of all active demo queries.

    Returns query texts in display order for auto-play sequence.
    Frontend can cycle through these with typing animation.
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Demo mode not configured"
        )

    try:
        result = supabase.table('demo_queries')\
            .select('query_text, display_order')\
            .eq('is_active', True)\
            .order('display_order')\
            .execute()

        queries = [row['query_text'] for row in result.data]

        return DemoQueriesResponse(
            queries=queries,
            total=len(queries)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch demo queries: {str(e)}"
        )


@router.get('/next')
async def get_next_demo():
    """
    Get next demo query with cached results.

    Cycles through demos in order. Returns query + pre-cached results
    for instant display (no API calls needed).
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Demo mode not configured"
        )

    try:
        # Get all active demos in order
        result = supabase.table('demo_queries')\
            .select('*')\
            .eq('is_active', True)\
            .order('display_order')\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="No demo queries available"
            )

        # For now, just return first one (can add cycling logic later)
        demo = result.data[0]

        return {
            'query': demo['query_text'],
            'results': demo.get('results_json', []),
            'total_found': len(demo.get('results_json', [])),
            'from_demo': True
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch demo: {str(e)}"
        )


@router.post('/save')
async def save_demo_query(
    query: str,
    results: List[Dict[str, Any]],
    display_order: Optional[int] = None
):
    """
    Save a search as a demo query (admin/curation endpoint).

    After running impressive searches manually, use this to save them
    for demo mode auto-play.

    Args:
        query: Search query text
        results: Search results to cache
        display_order: Order in demo sequence (optional)
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Demo mode not configured"
        )

    try:
        # Get max display order if not provided
        if display_order is None:
            max_order = supabase.table('demo_queries')\
                .select('display_order')\
                .order('display_order', desc=True)\
                .limit(1)\
                .execute()

            display_order = (max_order.data[0]['display_order'] + 1) if max_order.data else 1

        # Insert or update
        data = {
            'query_text': query,
            'results_json': results,
            'display_order': display_order,
            'is_active': True
        }

        result = supabase.table('demo_queries')\
            .upsert(data, on_conflict='query_text')\
            .execute()

        return {
            'status': 'saved',
            'query': query,
            'results_count': len(results),
            'display_order': display_order
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save demo query: {str(e)}"
        )


@router.post('/refresh')
async def refresh_demo_cache():
    """
    Refresh all demo query caches (background job).

    Re-runs all demo searches to ensure fresh, impressive results.
    Should be called daily via cron.
    """
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Demo mode not configured"
        )

    try:
        # Import here to avoid circular dependency
        from api.services.conversation_service import ConversationService

        conversation = ConversationService()

        # Get all active demos
        demos = supabase.table('demo_queries')\
            .select('*')\
            .eq('is_active', True)\
            .execute()

        refreshed_count = 0

        for demo in demos.data:
            try:
                # Re-run search
                result = await conversation.handle_query(demo['query_text'])

                # Update with fresh results
                supabase.table('demo_queries')\
                    .update({
                        'results_json': result.get('results', []),
                        'last_refreshed': 'now()'
                    })\
                    .eq('id', demo['id'])\
                    .execute()

                refreshed_count += 1
                print(f"✅ Refreshed demo: {demo['query_text']}")

            except Exception as e:
                print(f"⚠️ Failed to refresh {demo['query_text']}: {e}")
                continue

        return {
            'status': 'refreshed',
            'total': len(demos.data),
            'refreshed': refreshed_count
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh demos: {str(e)}"
        )
