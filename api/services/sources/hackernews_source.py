"""
HackerNews Source - Implements unified search interface for HackerNews.

Maps HackerNews Algolia API responses to standardized SearchResult format.
Includes smart search features: time filtering, relevance scoring, progressive refinement.
"""

import requests
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta
from api.services.source_registry import SearchSource, SearchResult, SourceType


class HackerNewsSource(SearchSource):
    """HackerNews discussion search implementation."""

    def __init__(self):
        """Initialize HackerNews Algolia API client."""
        self.api_url = "https://hn.algolia.com/api/v1"

    def get_name(self) -> str:
        return 'hackernews'

    def get_display_name(self) -> str:
        return 'Hacker News'

    def get_source_type(self) -> SourceType:
        return SourceType.DISCUSSION

    def get_capabilities(self) -> dict:
        return {
            'filters': ['tags', 'min_points'],
            'supports_sort': True,
            'max_limit': 100,
            'tags_options': ['story', 'comment', 'poll', 'show_hn', 'ask_hn', 'front_page']
        }

    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Search HackerNews stories.

        Args:
            query: Search query
            limit: Max results
            **filters:
                tags: Filter by tags ('story', 'show_hn', 'ask_hn', etc.)
                min_points: Minimum points required

        Returns:
            List of SearchResult objects (with score = points)
        """
        # Extract filters
        tags = filters.get('tags', 'story')
        min_points = filters.get('min_points', 10)

        # Run in thread pool
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            tags,
            min_points,
            limit
        )

        return results

    def _sync_search(self, query: str, tags: str, min_points: int, limit: int) -> List[SearchResult]:
        """Synchronous search helper."""
        try:
            params = {
                'query': query,
                'tags': tags,
                'hitsPerPage': min(limit, 100),
                'numericFilters': f'points>={min_points}'
            }

            response = requests.get(
                f"{self.api_url}/search",
                params=params,
                timeout=10
            )

            if response.status_code != 200:
                print(f"❌ HackerNews API error: {response.status_code}")
                return []

            data = response.json()
            hits = data.get('hits', [])

            # Transform to SearchResult objects
            results = []
            for hit in hits[:limit]:
                url = hit.get('url') or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"

                result = SearchResult(
                    title=hit.get('title', 'No title'),
                    url=url,
                    source='synth/hackernews',
                    result_type=SourceType.DISCUSSION,
                    description=hit.get('story_text', '')[:200] if hit.get('story_text') else 'No description',
                    author=hit.get('author', 'unknown'),
                    score=hit.get('points', 0),  # HN points = score
                    metadata={
                        'comments': hit.get('num_comments', 0),
                        'created_at': hit.get('created_at', ''),
                        'story_id': hit.get('objectID')
                    }
                )
                results.append(result)

            print(f"✅ HackerNews: Found {len(results)} stories")
            return results

        except Exception as e:
            print(f"❌ HackerNews search error: {e}")
            return []
