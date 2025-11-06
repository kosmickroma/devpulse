"""
Rate Limiting Service for SYNTH AI

Protects against abuse and manages daily query limits.
"""

from supabase import create_client, Client
import os
from datetime import datetime, timedelta
from typing import Dict


class RateLimitService:
    """Manages rate limits for AI queries."""

    def __init__(self):
        """Initialize with Supabase connection."""
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY', os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))

        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not configured")

        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Rate limits
        self.daily_limit_per_user = 50  # Free tier: 50 queries/day
        self.global_daily_limit = 1200  # Reserve 300 for buffer

    def check_user_limit(self, user_id: str) -> Dict:
        """
        Check if user has queries remaining today.

        Args:
            user_id: User's UUID

        Returns:
            Dict with 'allowed', 'remaining', 'limit' keys
        """
        try:
            # Get user's usage in last 24 hours
            since = (datetime.utcnow() - timedelta(days=1)).isoformat()

            result = self.supabase.table('ai_usage')\
                .select('id')\
                .eq('user_id', user_id)\
                .gte('created_at', since)\
                .execute()

            count = len(result.data) if result.data else 0
            remaining = max(0, self.daily_limit_per_user - count)

            return {
                'allowed': remaining > 0,
                'remaining': remaining,
                'limit': self.daily_limit_per_user,
                'count': count
            }
        except Exception as e:
            # On error, allow request but log
            print(f"Rate limit check error: {e}")
            return {
                'allowed': True,
                'remaining': self.daily_limit_per_user,
                'limit': self.daily_limit_per_user,
                'count': 0
            }

    def check_global_limit(self) -> bool:
        """
        Check if global daily limit is exceeded.

        Returns:
            True if requests allowed, False if limit hit
        """
        try:
            # Get total usage in last 24 hours
            since = (datetime.utcnow() - timedelta(days=1)).isoformat()

            result = self.supabase.table('ai_usage')\
                .select('id', count='exact')\
                .gte('created_at', since)\
                .execute()

            count = result.count if hasattr(result, 'count') else len(result.data)

            return count < self.global_daily_limit
        except Exception as e:
            # On error, allow request but log
            print(f"Global limit check error: {e}")
            return True

    def get_user_stats(self, user_id: str) -> Dict:
        """
        Get user's AI usage statistics.

        Args:
            user_id: User's UUID

        Returns:
            Dict with usage stats
        """
        try:
            # Last 24 hours
            since_24h = (datetime.utcnow() - timedelta(days=1)).isoformat()
            # Last 7 days
            since_7d = (datetime.utcnow() - timedelta(days=7)).isoformat()

            result_24h = self.supabase.table('ai_usage')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('created_at', since_24h)\
                .execute()

            result_7d = self.supabase.table('ai_usage')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('created_at', since_7d)\
                .execute()

            data_24h = result_24h.data if result_24h.data else []
            data_7d = result_7d.data if result_7d.data else []

            # Count by type
            types_24h = {}
            for item in data_24h:
                query_type = item.get('query_type', 'unknown')
                types_24h[query_type] = types_24h.get(query_type, 0) + 1

            return {
                'last_24_hours': len(data_24h),
                'last_7_days': len(data_7d),
                'by_type_24h': types_24h,
                'remaining_today': max(0, self.daily_limit_per_user - len(data_24h))
            }
        except Exception as e:
            print(f"Stats error: {e}")
            return {
                'last_24_hours': 0,
                'last_7_days': 0,
                'by_type_24h': {},
                'remaining_today': self.daily_limit_per_user
            }
