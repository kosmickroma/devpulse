"""
RT (Russia Today) Source - Implements unified search interface for RT News.

Fetches international news from Russian perspective via RT RSS feed.
Based on POC: RT English RSS spider (2025-11-27)
"""

import requests
from bs4 import BeautifulSoup
import asyncio
import html
from typing import List, Optional
from datetime import datetime
from email.utils import parsedate_to_datetime
from api.services.source_registry import SearchSource, SearchResult, SourceType
from api.services.relevance_scorer import relevance_scorer


class RTSource(SearchSource):
    """RT (Russia Today) search implementation using RSS feed."""

    def __init__(self):
        """Initialize RT RSS feed."""
        self.feed_url = "https://www.rt.com/rss/news/"

    def get_name(self) -> str:
        return 'rt'

    def get_display_name(self) -> str:
        return 'RT'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': [],
            'supports_sort': False,
            'max_limit': 150  # Generous for full feed (100+)
        }

    async def search(
        self,
        query: str,
        limit: int = 100,
        **filters
    ) -> List[SearchResult]:
        """
        Search RT articles with relevance scoring.

        Fetches from RSS feed with full content extraction.

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

        Fetches articles from RT RSS feed with rich content extraction.
        """
        all_articles = []

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/131.0 Safari/537.36 DevPulseBot/1.0'
        }

        try:
            response = requests.get(self.feed_url, headers=headers, timeout=15)

            if response.status_code != 200:
                print(f"⚠️ RT feed error: {response.status_code}")
                return []

            soup = BeautifulSoup(response.content, 'xml')
            items = soup.find_all('item')

            print(f"✅ RT: Found {len(items)} items in feed")

            for item in items:
                # Extract title
                title_elem = item.find('title')
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)

                # Extract URL
                link = item.find('link')
                if not link or not link.text:
                    continue
                url = link.get_text(strip=True)

                # Extract description with HTML entity cleaning
                description = "No description available"
                desc = item.find('description')
                if desc and desc.string:
                    raw = html.unescape(desc.string)
                    clean_soup = BeautifulSoup(raw, 'html.parser')
                    text = clean_soup.get_text(separator=' ', strip=True)
                    description = text[:2000] + ("..." if len(text) > 2000 else "")

                # Extract author - use dc:creator where available
                author = "RT"
                creator = item.find('dc:creator') or item.find('author')
                if creator and creator.get_text(strip=True):
                    author = creator.get_text(strip=True)

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
            print(f"⚠️ RT feed error: {e}")
            return []

        print(f"✅ RT: Total {len(all_articles)} articles from feed")

        # Apply relevance scoring
        results = []
        for article in all_articles:
            score = relevance_scorer.calculate_relevance(
                search_query=query,
                title=article['title'],
                body=article['description']
            )

            # General news source - use moderate threshold (same as BBC/DW)
            if score > 0.05 or len(query.split()) <= 2:
                result = SearchResult(
                    title=article['title'],
                    url=article['url'],
                    source='rt',
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

        print(f"✅ RT: Returning {len(results)} relevant articles")
        return results
