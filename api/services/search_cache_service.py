"""
Search Cache Service - 10x faster SYNTH responses

Caches search results in Supabase for instant retrieval.
- Hash-based query matching
- 24-hour TTL
- Tracks cache effectiveness
"""

from typing import Optional, Dict, Any
import hashlib
import json
from datetime import datetime, timedelta
from supabase import create_client, Client
import os


class SearchCacheService:
    """Service for caching SYNTH search results."""

    def __init__(self):
        """Initialize cache service with Supabase."""
        try:
            SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

            if SUPABASE_URL and SUPABASE_KEY:
                self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
                self.enabled = True
                print("✅ Search cache initialized")
            else:
                self.supabase = None
                self.enabled = False
                print("⚠️ Search cache disabled - Supabase not configured")
        except Exception as e:
            print(f"⚠️ Search cache initialization failed: {e}")
            self.supabase = None
            self.enabled = False

        self.cache_ttl = timedelta(hours=24)

    def _hash_query(self, query: str, intent: Dict[str, Any]) -> str:
        """
        Generate consistent hash for query + intent.

        Args:
            query: Search query text
            intent: Parsed intent (sources, keywords, language)

        Returns:
            MD5 hash string
        """
        # Normalize query
        normalized_query = query.lower().strip()

        # Create deterministic intent string
        sources = sorted(intent.get('sources', []))
        keywords = sorted(intent.get('keywords', []))
        language = intent.get('language', '')

        cache_key = f"{normalized_query}|{','.join(sources)}|{','.join(keywords)}|{language}"

        return hashlib.md5(cache_key.encode()).hexdigest()

    async def get_cached_results(self, query: str, intent: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached search results if available.

        Args:
            query: Search query
            intent: Parsed search intent

        Returns:
            Cached results dict or None
        """
        if not self.enabled:
            return None

        try:
            query_hash = self._hash_query(query, intent)

            # Query cache with expiration check
            result = self.supabase.table('search_cache')\
                .select('*')\
                .eq('query_hash', query_hash)\
                .gte('expires_at', datetime.now().isoformat())\
                .limit(1)\
                .execute()

            if result.data and len(result.data) > 0:
                cache_entry = result.data[0]

                # Increment hit count
                self._increment_hit_count(cache_entry['id'])

                print(f"✅ Cache HIT: {query_hash[:8]}... ({cache_entry['result_count']} results)")

                return {
                    'results': cache_entry['results_json'],
                    'intent': cache_entry['intent_json'],
                    'total_found': cache_entry['result_count'],
                    'from_cache': True,
                    'cached_at': cache_entry['created_at']
                }

            print(f"❌ Cache MISS: {query_hash[:8]}...")
            return None

        except Exception as e:
            print(f"⚠️ Cache lookup error: {e}")
            return None

    async def cache_results(self, query: str, intent: Dict[str, Any], results: list) -> bool:
        """
        Store search results in cache.

        Args:
            query: Search query
            intent: Parsed search intent
            results: Search results to cache

        Returns:
            Success boolean
        """
        if not self.enabled:
            return False

        try:
            query_hash = self._hash_query(query, intent)
            expires_at = datetime.now() + self.cache_ttl

            # Insert cache entry
            self.supabase.table('search_cache').insert({
                'query_hash': query_hash,
                'query_text': query,
                'intent_json': intent,
                'results_json': results,
                'result_count': len(results),
                'expires_at': expires_at.isoformat(),
                'hit_count': 0
            }).execute()

            print(f"💾 Cached: {query_hash[:8]}... ({len(results)} results, TTL: 24h)")
            return True

        except Exception as e:
            print(f"⚠️ Cache save error: {e}")
            return False

    def _increment_hit_count(self, cache_id: str):
        """Increment cache hit counter for analytics."""
        try:
            self.supabase.rpc('increment_cache_hits', {'cache_id': cache_id}).execute()
        except Exception:
            # Fallback if RPC doesn't exist
            try:
                result = self.supabase.table('search_cache')\
                    .select('hit_count')\
                    .eq('id', cache_id)\
                    .single()\
                    .execute()

                if result.data:
                    new_count = result.data['hit_count'] + 1
                    self.supabase.table('search_cache')\
                        .update({'hit_count': new_count})\
                        .eq('id', cache_id)\
                        .execute()
            except Exception as e:
                print(f"⚠️ Hit count update failed: {e}")

    async def cleanup_expired(self) -> int:
        """
        Remove expired cache entries (maintenance task).

        Returns:
            Number of entries deleted
        """
        if not self.enabled:
            return 0

        try:
            result = self.supabase.table('search_cache')\
                .delete()\
                .lt('expires_at', datetime.now().isoformat())\
                .execute()

            count = len(result.data) if result.data else 0
            print(f"🧹 Cleaned up {count} expired cache entries")
            return count

        except Exception as e:
            print(f"⚠️ Cache cleanup error: {e}")
            return 0
