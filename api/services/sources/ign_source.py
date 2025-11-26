"""
IGN Source - Implements unified search interface for IGN gaming news.

Uses IGN's GraphQL API to fetch latest gaming news and articles.
Based on POC: /mnt/c/Users/carol/poc_spiders/ign-poc/poc_ign_spider.py
"""

import requests
import asyncio
from typing import List, Optional
from datetime import datetime
from api.services.source_registry import SearchSource, SearchResult, SourceType
from api.services.relevance_scorer import relevance_scorer


class IGNSource(SearchSource):
    """IGN gaming news search implementation."""

    def __init__(self):
        """Initialize IGN GraphQL API client."""
        self.graphql_url = 'https://mollusk.apis.ign.com/graphql'
        self.graphql_payload = {
            "operationName": "HomepageContentFeed",
            "variables": {
                "filter": "Latest",
                "region": "us",
                "startIndex": 0,
                "count": 50,  # Fetch 50 for better filtering
                "newsOnly": True
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "80680a041c4ed5db953468780e16a639d92ee5963a766259c66b563a64d44ef8"
                }
            }
        }

    def get_name(self) -> str:
        return 'ign'

    def get_display_name(self) -> str:
        return 'IGN'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': ['category'],
            'supports_sort': False,  # IGN API returns chronological
            'max_limit': 30
        }

    async def search(
        self,
        query: str,
        limit: int = 30,
        **filters
    ) -> List[SearchResult]:
        """
        Search IGN articles with relevance scoring.

        Args:
            query: Search query (filters results by relevance)
            limit: Max results
            **filters:
                category: Filter by category (optional)

        Returns:
            List of SearchResult objects
        """
        # Run in thread pool
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            limit,
            filters
        )

        return results

    def _sync_search(self, query: str, limit: int, filters: dict) -> List[SearchResult]:
        """
        Synchronous search helper (runs in thread pool).

        Fetches latest IGN articles from GraphQL API and filters by relevance.
        """
        results = []

        try:
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }

            response = requests.post(
                self.graphql_url,
                json=self.graphql_payload,
                headers=headers,
                timeout=10
            )

            if response.status_code != 200:
                print(f"❌ IGN API error: {response.status_code}")
                return []

            data = response.json()
            feed_items = data.get('data', {}).get('homepage', {}).get('contentFeed', {}).get('feedItems', [])

            print(f"✅ IGN: Retrieved {len(feed_items)} articles")

            # Process each article
            for item_data in feed_items:
                content = item_data.get('content')
                if not content:
                    continue

                title = content.get('title', '')
                relative_url = content.get('url', '')
                description = content.get('subtitle', '')
                category = content.get('type', 'News')

                # Build full URL from relative path
                if relative_url:
                    url = relative_url if relative_url.startswith('http') else f"https://www.ign.com{relative_url}"
                else:
                    url = None

                # Skip if missing essential fields
                if not title or not url:
                    continue

                # Calculate relevance score
                score = relevance_scorer.calculate_relevance(
                    search_query=query,
                    title=title,
                    body=description
                )

                # Include all gaming articles (IGN is gaming-only, so relevance filter is less critical)
                # Use very low threshold since we're already on a gaming-specific site
                if score > 0.01 or len(query.split()) <= 2:
                    result = SearchResult(
                        title=title,
                        url=url,
                        source='ign',
                        result_type=SourceType.ARTICLE,
                        description=description,
                        author='IGN',
                        score=score,
                        metadata={
                            'category': category
                        }
                    )
                    results.append(result)

            # Sort by relevance score
            results.sort(key=lambda x: x.score, reverse=True)

            # Limit results
            results = results[:limit]

            print(f"✅ IGN: Found {len(results)} relevant articles")
            return results

        except Exception as e:
            print(f"❌ IGN search error: {e}")
            return []
