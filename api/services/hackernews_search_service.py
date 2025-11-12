"""
HackerNews Search Service - Custom API searches for SYNTH

Provides HackerNews search via Algolia API for custom searches beyond trending data.
"""

import requests
from typing import List, Dict, Optional
from datetime import datetime


class HackerNewsSearchService:
    """Service for searching HackerNews stories via Algolia API."""

    def __init__(self):
        """Initialize HackerNews Algolia API client."""
        self.api_url = "https://hn.algolia.com/api/v1"
        # No API key required for Algolia HN API!

    def search_stories(
        self,
        query: str,
        tags: str = "story",
        min_points: int = 10,
        limit: int = 10
    ) -> List[Dict]:
        """
        Search HackerNews stories by query.

        Args:
            query: Search query (e.g., "machine learning", "rust tutorials")
            tags: Filter by tags ('story', 'comment', 'poll', 'show_hn', 'ask_hn')
            min_points: Minimum points required
            limit: Max results to return

        Returns:
            List of story dictionaries with:
            - title
            - url
            - points
            - comments (count)
            - author
            - created_at
        """
        try:
            # Build search parameters
            params = {
                'query': query,
                'tags': tags,
                'hitsPerPage': min(limit, 100),  # Algolia max is 1000, we limit to 100
                'numericFilters': f'points>={min_points}'
            }

            # Make API request
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

            # Transform results
            results = []
            for hit in hits[:limit]:
                # Skip items without URLs (comments, etc.)
                url = hit.get('url') or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"

                results.append({
                    'title': hit.get('title', 'No title'),
                    'url': url,
                    'points': hit.get('points', 0),
                    'comments': hit.get('num_comments', 0),
                    'author': hit.get('author', 'unknown'),
                    'source': 'synth/hackernews',  # Special source tag for SYNTH results
                    'created_at': hit.get('created_at', ''),
                    'story_id': hit.get('objectID'),
                    'description': hit.get('story_text', '')[:200] if hit.get('story_text') else 'No description',
                })

            print(f"✅ Found {len(results)} HackerNews stories for query: {query}")
            return results

        except Exception as e:
            print(f"❌ HackerNews search error: {e}")
            return []

    def search_by_date(
        self,
        query: str,
        tags: str = "story",
        limit: int = 10
    ) -> List[Dict]:
        """
        Search HackerNews stories sorted by date (most recent first).

        Args:
            query: Search query
            tags: Filter by tags
            limit: Max results to return

        Returns:
            List of recent story dictionaries
        """
        try:
            params = {
                'query': query,
                'tags': tags,
                'hitsPerPage': min(limit, 100)
            }

            # Use the search_by_date endpoint for recency
            response = requests.get(
                f"{self.api_url}/search_by_date",
                params=params,
                timeout=10
            )

            if response.status_code != 200:
                print(f"❌ HackerNews API error: {response.status_code}")
                return []

            data = response.json()
            hits = data.get('hits', [])

            results = []
            for hit in hits[:limit]:
                url = hit.get('url') or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"

                results.append({
                    'title': hit.get('title', 'No title'),
                    'url': url,
                    'points': hit.get('points', 0),
                    'comments': hit.get('num_comments', 0),
                    'author': hit.get('author', 'unknown'),
                    'source': 'synth/hackernews',
                    'created_at': hit.get('created_at', ''),
                    'story_id': hit.get('objectID'),
                    'description': hit.get('story_text', '')[:200] if hit.get('story_text') else 'No description',
                })

            print(f"✅ Found {len(results)} recent HackerNews stories for: {query}")
            return results

        except Exception as e:
            print(f"❌ HackerNews search error: {e}")
            return []

    def get_top_stories(self, limit: int = 10) -> List[Dict]:
        """
        Get top stories from HackerNews (fallback for non-search queries).

        Args:
            limit: Max results to return

        Returns:
            List of top story dictionaries
        """
        try:
            # Search for empty query to get top stories
            params = {
                'tags': 'front_page',
                'hitsPerPage': min(limit, 100)
            }

            response = requests.get(
                f"{self.api_url}/search",
                params=params,
                timeout=10
            )

            if response.status_code != 200:
                return []

            data = response.json()
            hits = data.get('hits', [])

            results = []
            for hit in hits[:limit]:
                url = hit.get('url') or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"

                results.append({
                    'title': hit.get('title', 'No title'),
                    'url': url,
                    'points': hit.get('points', 0),
                    'comments': hit.get('num_comments', 0),
                    'author': hit.get('author', 'unknown'),
                    'source': 'synth/hackernews',
                    'created_at': hit.get('created_at', ''),
                    'story_id': hit.get('objectID'),
                    'description': hit.get('story_text', '')[:200] if hit.get('story_text') else 'No description',
                })

            return results

        except Exception as e:
            print(f"❌ HackerNews top stories error: {e}")
            return []
