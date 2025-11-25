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
from api.services.relevance_scorer import relevance_scorer


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
        Search HackerNews stories with progressive refinement.

        Uses smart fallback strategy: if initial query returns too few results,
        automatically tries broader queries. Copied from GitHub's proven pattern.

        Args:
            query: Search query
            limit: Max results
            **filters:
                tags: Filter by tags ('story', 'show_hn', 'ask_hn', etc.)
                min_points: Minimum points required (default: 10)
                time_filter: 'day', 'week', 'month', 'year' (optional)

        Returns:
            List of SearchResult objects (with score = points)
        """
        # Extract filters
        tags = filters.get('tags', 'story')
        min_points = filters.get('min_points', 10)
        time_filter = filters.get('time_filter')  # 'day', 'week', 'month', 'year'

        # Run in thread pool
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            tags,
            min_points,
            time_filter,
            limit
        )

        # Progressive refinement: if too few results, try with lower threshold
        # COPIED FROM GITHUB SOURCE (lines 117-145)
        if len(results) < 5 and min_points > 5:
            print(f"⚡ Progressive refinement: Only {len(results)} results, trying with points>=5")

            fallback_results = await loop.run_in_executor(
                None,
                self._sync_search,
                query,
                tags,
                5,  # Lower points threshold
                time_filter,
                limit
            )

            # Combine and deduplicate by URL
            seen_urls = {r.url for r in results}
            for r in fallback_results:
                if r.url not in seen_urls:
                    results.append(r)
                    seen_urls.add(r.url)

            # Re-sort by relevance then points
            results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

        return results[:limit]

    def _sync_search(self, query: str, tags: str, min_points: int, time_filter: Optional[str], limit: int) -> List[SearchResult]:
        """
        Synchronous search helper (runs in thread pool).

        Implements over-fetching + client-side filtering pattern from GitHub source.
        """
        try:
            # Build time filter (HN uses Unix timestamps)
            numeric_filters = f'points>={min_points}'
            if time_filter:
                timestamp = self._get_timestamp_filter(time_filter)
                if timestamp:
                    numeric_filters += f',created_at_i>{timestamp}'

            params = {
                'query': query,
                'tags': tags,
                'hitsPerPage': min(limit * 2, 100),  # Over-fetch 2x for relevance filtering (GitHub pattern line 154)
                'numericFilters': numeric_filters
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

            # Transform to SearchResult objects with relevance scoring
            results = []
            for hit in hits:
                # Calculate relevance score using unified scorer
                relevance = relevance_scorer.calculate_relevance(
                    title=hit.get('title', ''),
                    body=hit.get('story_text'),
                    tags=[],  # HN doesn't have tags
                    search_query=query,
                    metadata={
                        'stars': hit.get('points', 0),
                        'year': self._extract_year(hit.get('created_at', '')),
                        'has_description': bool(hit.get('story_text'))
                    }
                )

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
                        'story_id': hit.get('objectID'),
                        'relevance_score': relevance
                    }
                )
                results.append(result)

            # Sort by relevance first, then by points (COPIED FROM GITHUB SOURCE line 200)
            results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

            # Return top results after filtering
            final_results = results[:limit]
            print(f"✅ HackerNews: Found {len(final_results)} stories (filtered from {len(hits)})")
            return final_results

        except Exception as e:
            print(f"❌ HackerNews search error: {e}")
            return []

    def _get_timestamp_filter(self, time_filter: str) -> Optional[int]:
        """
        Convert time filter to Unix timestamp for HN API.

        Args:
            time_filter: 'day' | 'week' | 'month' | 'year'

        Returns:
            Unix timestamp (seconds since epoch)
        """
        days_map = {'day': 1, 'week': 7, 'month': 30, 'year': 365}
        days = days_map.get(time_filter)

        if days:
            threshold = datetime.now() - timedelta(days=days)
            return int(threshold.timestamp())

        return None

    def _extract_year(self, date_string: str) -> Optional[int]:
        """Extract year from HN's date format."""
        if not date_string:
            return None
        try:
            # HN uses ISO format: 2024-11-24T...
            return int(date_string[:4])
        except:
            return None
