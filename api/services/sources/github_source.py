"""
GitHub Source - Implements unified search interface for GitHub.

Maps GitHub API responses to standardized SearchResult format.
"""

import os
import requests
import asyncio
from typing import List, Optional
from api.services.source_registry import SearchSource, SearchResult, SourceType


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

    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Search GitHub repositories.

        Args:
            query: Search query
            limit: Max results
            **filters:
                language: Programming language (e.g., "Python")
                min_stars: Minimum stars required (default: 100)
                sort: Sort by 'stars', 'forks', or 'updated'

        Returns:
            List of SearchResult objects
        """
        # Extract filters
        language = filters.get('language')
        min_stars = filters.get('min_stars', 10)  # Lowered from 100 to find more results
        sort = filters.get('sort', 'stars')

        # Build search query
        search_query = f"{query} stars:>{min_stars}"
        if language:
            search_query += f" language:{language}"

        # Make API request (async wrapper for requests)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            search_query,
            sort,
            limit
        )

        return results

    def _sync_search(self, search_query: str, sort: str, limit: int) -> List[SearchResult]:
        """Synchronous search helper (runs in thread pool)."""
        try:
            params = {
                'q': search_query,
                'sort': sort,
                'order': 'desc',
                'per_page': min(limit, 100)
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

            # Transform to SearchResult objects
            results = []
            for repo in items[:limit]:
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
                        'category': 'repository'
                    }
                )
                results.append(result)

            print(f"✅ GitHub: Found {len(results)} repos")
            return results

        except Exception as e:
            print(f"❌ GitHub search error: {e}")
            return []
