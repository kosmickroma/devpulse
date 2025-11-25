"""
Dev.to Source - Implements unified search interface for Dev.to.

Maps Dev.to API responses to standardized SearchResult format.
Includes smart search features: relevance scoring, progressive refinement, time filtering.
COPIED FROM GITHUB SOURCE PATTERNS (github_source.py lines 69-256).
"""

import requests
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta
from api.services.source_registry import SearchSource, SearchResult, SourceType


class DevToSource(SearchSource):
    """Dev.to article search implementation."""

    def __init__(self):
        """Initialize Dev.to API client."""
        self.api_url = "https://dev.to/api"

    def get_name(self) -> str:
        return 'devto'

    def get_display_name(self) -> str:
        return 'Dev.to'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': ['tag', 'min_reactions', 'sort'],
            'supports_sort': True,
            'max_limit': 100,
            'sort_options': ['reactions', 'comments', 'published']
        }

    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Search Dev.to articles with progressive refinement.

        Uses smart fallback strategy: if initial query returns too few results,
        automatically tries broader queries. COPIED FROM GITHUB SOURCE (lines 69-145).

        Args:
            query: Search query
            limit: Max results
            **filters:
                tag: Filter by tag (e.g., "python", "javascript")
                min_reactions: Minimum reactions required (default: 5)
                sort: Sort by 'reactions', 'comments', or 'published'
                time_filter: 'day', 'week', 'month', 'year' (optional)

        Returns:
            List of SearchResult objects
        """
        # Extract filters
        tag = filters.get('tag')
        min_reactions = filters.get('min_reactions', 5)
        sort = filters.get('sort', 'reactions')
        time_filter = filters.get('time_filter')

        # Run in thread pool
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            tag,
            min_reactions,
            sort,
            time_filter,
            limit
        )

        # Progressive refinement: if too few results, try with lower threshold
        # COPIED FROM GITHUB SOURCE (lines 117-145)
        if len(results) < 5 and min_reactions > 0:
            print(f"⚡ Progressive refinement: Only {len(results)} results, trying with reactions>=0")

            fallback_results = await loop.run_in_executor(
                None,
                self._sync_search,
                query,
                tag,
                0,  # Lower reactions threshold
                sort,
                time_filter,
                limit
            )

            # Combine and deduplicate by URL
            seen_urls = {r.url for r in results}
            for r in fallback_results:
                if r.url not in seen_urls:
                    results.append(r)
                    seen_urls.add(r.url)

            # Re-sort by relevance then reactions
            results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

        return results[:limit]

    def _sync_search(
        self,
        query: str,
        tag: Optional[str],
        min_reactions: int,
        sort: str,
        time_filter: Optional[str],
        limit: int
    ) -> List[SearchResult]:
        """
        Synchronous search helper (runs in thread pool).

        Implements over-fetching + client-side filtering pattern from GitHub source.
        COPIED FROM GITHUB SOURCE (lines 147-209).
        """
        try:
            # Dev.to API: /api/articles
            # Note: Dev.to has limited search - we fetch many articles and filter client-side
            params = {
                'per_page': min(limit * 3, 100),  # Over-fetch 3x for better filtering
            }

            # Add tag filter if specified
            if tag:
                params['tag'] = tag

            # Add sort parameter
            # Dev.to doesn't have direct sorting, so we'll fetch and sort client-side

            response = requests.get(
                f"{self.api_url}/articles",
                params=params,
                timeout=10
            )

            if response.status_code != 200:
                print(f"❌ Dev.to API error: {response.status_code}")
                return []

            articles = response.json()

            # Extract search terms for relevance scoring
            search_terms = [t.strip().lower() for t in query.split() if len(t.strip()) > 2]

            # Transform to SearchResult objects with relevance scoring
            results = []
            for article in articles:
                # Calculate relevance score (COPIED FROM GITHUB SOURCE lines 211-255)
                relevance = self._calculate_relevance(article, search_terms)

                # Filter by minimum reactions
                reactions = article.get('public_reactions_count', 0)
                if reactions < min_reactions:
                    continue

                # Time filtering
                if time_filter:
                    published_date = datetime.fromisoformat(article.get('published_at', '').replace('Z', '+00:00'))
                    if not self._passes_time_filter(published_date, time_filter):
                        continue

                result = SearchResult(
                    title=article.get('title', 'No title'),
                    url=article.get('url', ''),
                    source='synth/devto',
                    result_type=SourceType.ARTICLE,
                    description=article.get('description', '')[:200] or 'No description',
                    author=article.get('user', {}).get('name', 'unknown'),
                    score=reactions,  # Reactions = score
                    metadata={
                        'comments': article.get('comments_count', 0),
                        'tags': article.get('tag_list', []),
                        'published_at': article.get('published_at', ''),
                        'reading_time_minutes': article.get('reading_time_minutes', 0),
                        'relevance_score': relevance
                    }
                )
                results.append(result)

            # Sort by relevance first, then by reactions (COPIED FROM GITHUB SOURCE line 200)
            results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

            # Return top results after filtering
            final_results = results[:limit]
            print(f"✅ Dev.to: Found {len(final_results)} articles (filtered from {len(articles)})")
            return final_results

        except Exception as e:
            print(f"❌ Dev.to search error: {e}")
            return []

    def _passes_time_filter(self, published_date: datetime, time_filter: str) -> bool:
        """
        Check if article passes time filter.

        Args:
            published_date: Article's published datetime
            time_filter: 'day' | 'week' | 'month' | 'year'

        Returns:
            True if article is within time range
        """
        days_map = {'day': 1, 'week': 7, 'month': 30, 'year': 365}
        days = days_map.get(time_filter, 365)

        threshold = datetime.now(published_date.tzinfo) - timedelta(days=days)
        return published_date >= threshold

    def _calculate_relevance(self, article: dict, search_terms: List[str]) -> float:
        """
        Calculate relevance score for a Dev.to article.

        COPIED FROM GITHUB SOURCE (lines 211-255) with Dev.to-specific adaptations.

        Returns:
            Float score (0-100)
        """
        if not search_terms:
            return 50.0

        score = 0.0
        title = article.get('title', '').lower()
        description = article.get('description', '').lower()
        tags = [t.lower() for t in article.get('tag_list', [])]

        for term in search_terms:
            # Exact title match: highest weight
            if term == title:
                score += 50
            # Title contains term: high weight
            elif term in title:
                score += 30
            # Description contains term: medium weight
            elif term in description:
                score += 15
            # In tags: high weight (tags are very relevant in Dev.to)
            elif term in tags:
                score += 25

        # Bonus for high engagement (like GitHub's star bonus)
        reactions = article.get('public_reactions_count', 0)
        if reactions > 100:
            score += 10
        elif reactions > 50:
            score += 5

        # Bonus for high comment activity
        comments = article.get('comments_count', 0)
        if comments > 20:
            score += 5

        # Bonus for recent publication
        try:
            published = article.get('published_at', '')
            if '2024' in published or '2025' in published:
                score += 5
        except:
            pass

        # Bonus for having a description
        if article.get('description'):
            score += 5

        return min(score, 100.0)
