"""
Usage Tracking Service for SYNTH AI

Logs all AI queries for analytics and rate limiting.
"""

from supabase import create_client, Client
import os
from datetime import datetime


class UsageTracker:
    """Tracks AI usage to database for analytics."""

    def __init__(self):
        """Initialize with Supabase connection."""
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY', os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))

        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not configured")

        self.supabase: Client = create_client(supabase_url, supabase_key)

    def log_usage(self, user_id: str, query_type: str, tokens_used: int = 0) -> bool:
        """
        Log AI usage to database.

        Args:
            user_id: User's UUID
            query_type: 'summary', 'ask', or 'explain'
            tokens_used: Approximate tokens used (optional)

        Returns:
            True if logged successfully, False otherwise
        """
        try:
            self.supabase.table('ai_usage').insert({
                'user_id': user_id,
                'query_type': query_type,
                'tokens_used': tokens_used,
                'created_at': datetime.utcnow().isoformat()
            }).execute()

            return True
        except Exception as e:
            # Don't fail request if logging fails
            print(f"Usage tracking error: {e}")
            return False

    def log_cache_hit(self, user_id: str, article_url: str) -> bool:
        """
        Log when a cached summary is returned (saves API cost).

        Args:
            user_id: User's UUID
            article_url: URL of cached article

        Returns:
            True if logged successfully
        """
        try:
            # Log as summary but with 0 tokens (cache hit)
            self.supabase.table('ai_usage').insert({
                'user_id': user_id,
                'query_type': 'summary_cached',
                'tokens_used': 0,
                'created_at': datetime.utcnow().isoformat()
            }).execute()

            return True
        except Exception as e:
            print(f"Cache hit tracking error: {e}")
            return False
