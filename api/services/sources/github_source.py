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

        # Progressive refinement: if too few results, try with lower threshold
        if len(results) < 5 and min_stars > 0:
            print(f"⚡ Progressive refinement: Only {len(results)} results, trying with stars:>0")
            fallback_query = f"{query} stars:>0"
            if language:
                fallback_query += f" language:{language}"

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
            search_terms = [t.strip() for t in main_terms.split() if len(t.strip()) > 2]

            # Transform to SearchResult objects with relevance scoring
            results = []
            for repo in items:
                # Calculate relevance score
                relevance = self._calculate_relevance(repo, search_terms)

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

    def _calculate_relevance(self, repo: dict, search_terms: List[str]) -> float:
        """
        Calculate relevance score for a repository.

        Pro search engines use TF-IDF and semantic analysis. We use a simpler but effective
        approach: keyword matching in name/description with position weighting.

        Returns:
            Float score (0-100)
        """
        if not search_terms:
            return 50.0

        score = 0.0
        name = repo.get('name', '').lower()
        description = (repo.get('description') or '').lower()
        topics = [t.lower() for t in repo.get('topics', [])]

        for term in search_terms:
            # Exact name match: highest weight
            if term == name:
                score += 50
            # Name contains term: high weight
            elif term in name:
                score += 30
            # Description contains term: medium weight
            elif term in description:
                score += 15
            # In topics: medium weight
            elif term in topics:
                score += 20

        # Bonus for recent activity (repos updated in last year)
        try:
            updated = repo.get('updated_at', '')
            if '2024' in updated or '2025' in updated:
                score += 5
        except:
            pass

        # Bonus for having a description
        if repo.get('description'):
            score += 5

        return min(score, 100.0)
