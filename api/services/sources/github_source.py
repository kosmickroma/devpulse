"""
GitHub Source - Implements unified search interface for GitHub.

Maps GitHub API responses to standardized SearchResult format.
"""

import os
import requests
import asyncio
from typing import List, Optional
from api.services.source_registry import SearchSource, SearchResult, SourceType
from api.services.relevance_scorer import relevance_scorer


class GitHubSource(SearchSource):
    """GitHub repository search implementation."""

    def __init__(self):
        """Initialize GitHub API client."""
        self.api_url = "https://api.github.com"
        self.token = os.getenv('GITHUB_TOKEN')
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
        }
        if self.token:
            self.headers['Authorization'] = f'token {self.token}'

    def get_name(self) -> str:
        return 'github'

    def get_display_name(self) -> str:
        return 'GitHub'

    def get_source_type(self) -> SourceType:
        return SourceType.REPOSITORY

    def get_capabilities(self) -> dict:
        return {
            'filters': ['language', 'min_stars', 'sort'],
            'supports_sort': True,
            'max_limit': 100,
            'sort_options': ['stars', 'forks', 'updated']
        }

    def _build_date_filter(self, time_filter: Optional[str]) -> str:
        """
        Build date filter string for GitHub query.

        Args:
            time_filter: 'day' | 'week' | 'month' | 'year' | None

        Returns:
            Date filter string like " created:>2025-11-13" or empty string
        """
        if not time_filter:
            return ""

        from datetime import datetime, timedelta
        today = datetime.now()

        days_map = {'day': 1, 'week': 7, 'month': 30, 'year': 365}
        days = days_map.get(time_filter)

        if days:
            date_threshold = (today - timedelta(days=days)).strftime('%Y-%m-%d')
            return f" created:>{date_threshold}"

        return ""

    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Search GitHub repositories with progressive refinement.

        Uses smart fallback strategy: if initial query returns too few results,
        automatically tries broader queries. This is how professional search engines work.

        Args:
            query: Search query
            limit: Max results
            **filters:
                language: Programming language (e.g., "Python")
                min_stars: Minimum stars required (default: 5)
                sort: Sort by 'stars', 'forks', or 'updated'

        Returns:
            List of SearchResult objects
        """
        # Extract filters
        language = filters.get('language')
        min_stars = filters.get('min_stars', 5)  # Lowered to 5 for better coverage
        sort = filters.get('sort', 'stars')
        time_filter = filters.get('time_filter')  # 'day', 'week', 'month', 'year'

        # Build search query
        search_query = f"{query} stars:>{min_stars}"
        if language:
            search_query += f" language:{language}"
        search_query += self._build_date_filter(time_filter)

        # Debug logging
        print(f"🔍 GitHub API query: '{search_query}'")

        # Make API request (async wrapper for requests)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            search_query,
            sort,
            limit
        )

        # Progressive refinement: if too few results, try with lower threshold
        if len(results) < 5 and min_stars > 0:
            print(f"⚡ Progressive refinement: Only {len(results)} results, trying with stars:>0")
            fallback_query = f"{query} stars:>0"
            if language:
                fallback_query += f" language:{language}"
            fallback_query += self._build_date_filter(time_filter)  # CRITICAL: Preserve date filter!

            print(f"🔍 GitHub FALLBACK query: '{fallback_query}'")

            fallback_results = await loop.run_in_executor(
                None,
                self._sync_search,
                fallback_query,
                sort,
                limit
            )

            # Combine and deduplicate by URL
            seen_urls = {r.url for r in results}
            for r in fallback_results:
                if r.url not in seen_urls:
                    results.append(r)
                    seen_urls.add(r.url)

            # Re-sort by stars
            results.sort(key=lambda x: x.score, reverse=True)

        return results[:limit]

    def _sync_search(self, search_query: str, sort: str, limit: int) -> List[SearchResult]:
        """Synchronous search helper (runs in thread pool)."""
        try:
            params = {
                'q': search_query,
                'sort': sort,
                'order': 'desc',
                'per_page': min(limit * 2, 100)  # Fetch 2x to allow for relevance filtering
            }

            response = requests.get(
                f"{self.api_url}/search/repositories",
                headers=self.headers,
                params=params,
                timeout=10
            )

            if response.status_code != 200:
                print(f"❌ GitHub API error: {response.status_code}")
                return []

            data = response.json()
            items = data.get('items', [])

            # Extract main search terms for relevance scoring
            main_terms = search_query.lower().replace('stars:>0', '').replace('stars:>5', '').strip()
            # Remove language filters and date filters from query for relevance scoring
            main_terms = main_terms.split('language:')[0].split('created:')[0].split('pushed:')[0].strip()

            # Transform to SearchResult objects with relevance scoring
            results = []
            for repo in items:
                # Calculate relevance score using unified scorer
                relevance = relevance_scorer.calculate_relevance(
                    title=repo.get('name', ''),
                    body=repo.get('description'),
                    tags=repo.get('topics', []),
                    search_query=main_terms,
                    metadata={
                        'stars': repo.get('stargazers_count', 0),
                        'year': self._extract_year(repo.get('updated_at', '')),
                        'has_description': bool(repo.get('description'))
                    }
                )

                result = SearchResult(
                    title=repo['name'],
                    url=repo['html_url'],
                    source='synth/github',
                    result_type=SourceType.REPOSITORY,
                    description=repo['description'] or 'No description',
                    author=repo['owner']['login'],
                    score=repo['stargazers_count'],  # Stars = score
                    metadata={
                        'language': repo['language'] or 'Unknown',
                        'forks': repo.get('forks_count', 0),
                        'updated_at': repo.get('updated_at', ''),
                        'category': 'repository',
                        'relevance_score': relevance
                    }
                )
                results.append(result)

            # Sort by relevance first, then by stars
            results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

            # Return top results
            final_results = results[:limit]
            print(f"✅ GitHub: Found {len(final_results)} repos (filtered from {len(items)})")
            return final_results

        except Exception as e:
            print(f"❌ GitHub search error: {e}")
            return []

    def _extract_year(self, date_string: str) -> Optional[int]:
        """Extract year from GitHub's date format (2024-11-24T...)."""
        if not date_string:
            return None
        try:
            return int(date_string[:4])
        except:
            return None
