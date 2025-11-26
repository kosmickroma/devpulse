"""
PC Gamer Source - Implements unified search interface for PC Gamer news and reviews.

Scrapes PC Gamer's news/reviews pages using the selectors validated in POC.
Based on POC: /mnt/c/Users/carol/poc_spiders/pc-gamer-poc/pc_gamer_poc.py
"""

import requests
from bs4 import BeautifulSoup
import asyncio
from typing import List, Optional
from datetime import datetime
from api.services.source_registry import SearchSource, SearchResult, SourceType
from api.services.relevance_scorer import relevance_scorer


class PCGamerSource(SearchSource):
    """PC Gamer gaming news and reviews search implementation."""

    def __init__(self):
        """Initialize PC Gamer scraper."""
        self.base_url = 'https://www.pcgamer.com'
        self.news_url = f'{self.base_url}/news/'
        self.reviews_url = f'{self.base_url}/reviews/'

    def get_name(self) -> str:
        return 'pcgamer'

    def get_display_name(self) -> str:
        return 'PC Gamer'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': ['category'],  # 'news' or 'reviews'
            'supports_sort': False,  # Returns chronological
            'max_limit': 30
        }

    async def search(
        self,
        query: str,
        limit: int = 15,
        **filters
    ) -> List[SearchResult]:
        """
        Search PC Gamer articles with relevance scoring.

        Args:
            query: Search query (filters results by relevance)
            limit: Max results
            **filters:
                category: 'news' (default) or 'reviews'

        Returns:
            List of SearchResult objects
        """
        category = filters.get('category', 'news')

        # Run in thread pool
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            category,
            limit
        )

        return results

    def _sync_search(self, query: str, category: str, limit: int) -> List[SearchResult]:
        """
        Synchronous search helper (runs in thread pool).

        Scrapes PC Gamer news/reviews pages and filters by relevance.
        """
        results = []

        try:
            # Determine which page to scrape
            if category.lower() == 'reviews':
                url = self.reviews_url
            else:
                url = self.news_url

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"❌ PC Gamer error: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')

            # Find article containers (from POC: div.listingResult)
            articles = soup.select('div.listingResult')

            print(f"✅ PC Gamer: Found {len(articles)} {category} articles")

            for article in articles:
                # Extract fields using POC selectors
                title_elem = article.select_one('h3.article-name')
                title = title_elem.get_text(strip=True) if title_elem else None

                link_elem = article.select_one('a.article-link')
                relative_url = link_elem.get('href') if link_elem else None
                url = f"{self.base_url}{relative_url}" if relative_url else None

                author_elem = article.select_one('.byline span[style="white-space:nowrap"]')
                author = author_elem.get_text(strip=True) if author_elem else 'PC Gamer'

                date_elem = article.select_one('time')
                date_str = date_elem.get('datetime') if date_elem else None

                snippet_elem = article.select_one('p.synopsis')
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''

                # Skip if missing essential fields
                if not title or not url:
                    continue

                # Calculate relevance score
                score = relevance_scorer.calculate_relevance(
                    search_query=query,
                    title=title,
                    body=snippet
                )

                # Only include if relevance threshold met (or if query is very broad)
                if score > 0.1 or len(query.split()) <= 2:
                    # Parse date for metadata
                    created_at = None
                    if date_str:
                        try:
                            created_at = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        except:
                            pass

                    result = SearchResult(
                        title=title,
                        url=url,
                        source='pcgamer',
                        result_type=SourceType.ARTICLE,
                        description=snippet,
                        author=author,
                        score=score,
                        metadata={
                            'category': category,
                            'created_at': created_at.isoformat() if created_at else None
                        }
                    )
                    results.append(result)

            # Sort by relevance score
            results.sort(key=lambda x: x.score, reverse=True)

            # Limit results
            results = results[:limit]

            print(f"✅ PC Gamer: Found {len(results)} relevant articles")
            return results

        except Exception as e:
            print(f"❌ PC Gamer search error: {e}")
            return []
