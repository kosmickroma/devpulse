"""
GitHub Search Service - Custom API searches for SYNTH

Provides direct GitHub API access for custom searches beyond trending data.
"""

import os
import requests
from typing import List, Dict, Optional


class GitHubSearchService:
    """Service for searching GitHub repositories via API."""

    def __init__(self):
        """Initialize GitHub API client."""
        self.api_url = "https://api.github.com"
        self.token = os.getenv('GITHUB_TOKEN')  # Optional, increases rate limit
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
        }
        if self.token:
            self.headers['Authorization'] = f'token {self.token}'

    def search_repositories(
        self,
        query: str,
        language: Optional[str] = None,
        min_stars: int = 100,
        sort: str = "stars",
        limit: int = 10
    ) -> List[Dict]:
        """
        Search GitHub repositories by query.

        Args:
            query: Search query (e.g., "arcade games", "machine learning")
            language: Filter by programming language (e.g., "Python", "JavaScript")
            min_stars: Minimum stars required
            sort: Sort by 'stars', 'forks', or 'updated'
            limit: Max results to return

        Returns:
            List of repository dictionaries with:
            - title (name)
            - url
            - description
            - stars
            - language
            - author (owner)
        """
        try:
            # Build search query
            search_query = f"{query} stars:>{min_stars}"
            if language:
                search_query += f" language:{language}"

            # Make API request
            params = {
                'q': search_query,
                'sort': sort,
                'order': 'desc',
                'per_page': min(limit, 100)  # GitHub max is 100
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

            # Transform to our format
            results = []
            for repo in items[:limit]:
                results.append({
                    'title': repo['name'],
                    'url': repo['html_url'],
                    'description': repo['description'] or 'No description',
                    'stars': repo['stargazers_count'],
                    'language': repo['language'] or 'Unknown',
                    'author': repo['owner']['login'],
                    'source': 'synth/github',  # Special source tag for SYNTH results
                    'category': 'repository',
                    'forks': repo.get('forks_count', 0),
                    'updated_at': repo.get('updated_at', ''),
                })

            print(f"✅ Found {len(results)} GitHub repos for query: {query}")
            return results

        except Exception as e:
            print(f"❌ GitHub search error: {e}")
            return []

    def get_repository_details(self, owner: str, repo: str) -> Optional[Dict]:
        """
        Get detailed information about a specific repository.

        Args:
            owner: Repository owner username
            repo: Repository name

        Returns:
            Repository details dict or None
        """
        try:
            response = requests.get(
                f"{self.api_url}/repos/{owner}/{repo}",
                headers=self.headers,
                timeout=10
            )

            if response.status_code != 200:
                return None

            data = response.json()
            return {
                'title': data['name'],
                'url': data['html_url'],
                'description': data['description'] or 'No description',
                'stars': data['stargazers_count'],
                'language': data['language'] or 'Unknown',
                'author': data['owner']['login'],
                'source': 'synth/github',
                'forks': data['forks_count'],
                'open_issues': data['open_issues_count'],
                'created_at': data['created_at'],
                'updated_at': data['updated_at'],
            }

        except Exception as e:
            print(f"❌ GitHub repo details error: {e}")
            return None
