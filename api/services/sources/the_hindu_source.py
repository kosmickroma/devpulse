"""
The Hindu Source - Implements unified search interface for The Hindu News.

Fetches national news articles from The Hindu RSS feed.
Based on POC: The Hindu RSS spider (2025-11-27)
"""

import requests
from bs4 import BeautifulSoup
import asyncio
from typing import List, Optional
from datetime import datetime
from email.utils import parsedate_to_datetime
from api.services.source_registry import SearchSource, SearchResult, SourceType
from api.services.relevance_scorer import relevance_scorer


class TheHinduSource(SearchSource):
    """The Hindu news search implementation using RSS feed."""

    def __init__(self):
        """Initialize The Hindu RSS feed."""
        self.feed_url = "https://www.thehindu.com/news/national/feeder/default.rss"
        self.base_url = "https://www.thehindu.com"

    def get_name(self) -> str:
        return 'thehindu'

    def get_display_name(self) -> str:
        return 'The Hindu'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': [],
            'supports_sort': False,
            'max_limit': 120  # Full feed (~100 articles)
        }

    async def search(
        self,
        query: str,
        limit: int = 100,
        **filters
    ) -> List[SearchResult]:
        """
        Search The Hindu articles with relevance scoring.

        Fetches from RSS feed with relative URL fixing.

        Args:
            query: Search query (filters results by relevance)
            limit: Max results to return (default 100)
            **filters: Additional filters (not currently used)

        Returns:
            List of SearchResult objects sorted by relevance
        """
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            limit
        )
        return results

    def _sync_search(self, query: str, limit: int) -> List[SearchResult]:
        """
        Synchronous RSS fetch and parse (runs in thread pool).

        Fetches articles from The Hindu RSS feed.
        """
        all_articles = []

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/131.0 Safari/537.36 DevPulseBot/1.0'
        }

        try:
            response = requests.get(self.feed_url, headers=headers, timeout=15)

            if response.status_code != 200:
                print(f"⚠️ The Hindu feed error: {response.status_code}")
                return []

            soup = BeautifulSoup(response.content, 'xml')
            items = soup.find_all('item')

            print(f"✅ The Hindu: Found {len(items)} items in feed")

            for item in items:
                # Extract title
                title_elem = item.find('title')
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)

                # Extract URL and fix relative URLs
                link = item.find('link')
                if not link or not link.text:
                    continue
                raw_url = link.get_text(strip=True)
                # Fix relative URLs by prepending base domain
                url = raw_url if raw_url.startswith('http') else f"{self.base_url}{raw_url}"

                # Extract description
                description_elem = item.find('description')
                description = description_elem.get_text(strip=True) if description_elem else "No description available"

                # Static author for The Hindu
                author = "The Hindu"

                # Extract pub date
                pub_date = item.find('pubDate')
                pub_date_str = pub_date.get_text(strip=True) if pub_date else None
                created_at = None
                if pub_date_str:
                    try:
                        # Parse RFC 822 date format
                        created_at = parsedate_to_datetime(pub_date_str)
                    except Exception:
                        pass

                all_articles.append({
                    'title': title,
                    'url': url,
                    'description': description,
                    'author': author,
                    'created_at': created_at
                })

        except Exception as e:
            print(f"⚠️ The Hindu feed error: {e}")
            return []

        print(f"✅ The Hindu: Total {len(all_articles)} articles from feed")

        # Apply relevance scoring
        results = []
        for article in all_articles:
            score = relevance_scorer.calculate_relevance(
                search_query=query,
                title=article['title'],
                body=article['description']
            )

            # General news source - use moderate threshold (same as BBC)
            if score > 0.05 or len(query.split()) <= 2:
                result = SearchResult(
                    title=article['title'],
                    url=article['url'],
                    source='thehindu',
                    result_type=SourceType.ARTICLE,
                    description=article['description'],
                    author=article['author'],
                    score=score,
                    metadata={
                        'created_at': article['created_at'].isoformat() if article['created_at'] else None
                    }
                )
                results.append(result)

        # Sort by relevance score (descending)
        results.sort(key=lambda x: x.score, reverse=True)

        # Limit results
        results = results[:limit]

        print(f"✅ The Hindu: Returning {len(results)} relevant articles")
        return results
