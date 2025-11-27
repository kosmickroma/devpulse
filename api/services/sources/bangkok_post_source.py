"""
Bangkok Post Source - Implements unified search interface for Bangkok Post.

Fetches Thailand and Southeast Asia news from multiple Bangkok Post RSS feeds.
Based on POC: Bangkok Post multi-feed aggregation spider (2025-11-27)
"""

import requests
from bs4 import BeautifulSoup
import asyncio
from typing import List, Optional
from datetime import datetime
from email.utils import parsedate_to_datetime
from api.services.source_registry import SearchSource, SearchResult, SourceType
from api.services.relevance_scorer import relevance_scorer


class BangkokPostSource(SearchSource):
    """Bangkok Post search implementation using multiple RSS feeds."""

    def __init__(self):
        """Initialize Bangkok Post RSS feeds."""
        self.feeds = [
            "https://www.bangkokpost.com/rss/data/most-recent.xml",
            "https://www.bangkokpost.com/rss/data/topstories.xml",
            "https://www.bangkokpost.com/rss/data/thailand.xml",
            "https://www.bangkokpost.com/rss/data/world.xml",
            "https://www.bangkokpost.com/rss/data/business.xml"
        ]

    def get_name(self) -> str:
        return 'bangkokpost'

    def get_display_name(self) -> str:
        return 'Bangkok Post'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': [],
            'supports_sort': False,
            'max_limit': 200  # Generous for multiple feeds
        }

    async def search(
        self,
        query: str,
        limit: int = 100,
        **filters
    ) -> List[SearchResult]:
        """
        Search Bangkok Post articles with relevance scoring.

        Fetches from 5 RSS feeds, deduplicates, and filters by relevance.

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

        Fetches articles from all Bangkok Post RSS feeds, deduplicates by URL,
        and applies relevance scoring.
        """
        all_articles = []
        seen_urls = set()  # CRITICAL: Deduplication across feeds

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/131.0 Safari/537.36 DevPulseBot/1.0'
        }

        # Fetch from all feeds
        for feed_url in self.feeds:
            try:
                response = requests.get(feed_url, headers=headers, timeout=15)

                if response.status_code != 200:
                    print(f"⚠️ Bangkok Post feed error: {response.status_code} for {feed_url}")
                    continue

                soup = BeautifulSoup(response.content, 'xml')
                items = soup.find_all('item')

                feed_name = feed_url.split('/')[-1].replace('.xml', '')
                print(f"✅ Bangkok Post: Found {len(items)} items in {feed_name} feed")

                for item in items:
                    # Extract URL
                    link = item.find('link')
                    if not link or not link.text:
                        continue
                    url = link.get_text(strip=True)

                    # Deduplicate across feeds
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)

                    # Extract title
                    title_elem = item.find('title')
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    # Extract description
                    description = "No description available"
                    desc = item.find('description')
                    if desc:
                        description = desc.get_text(strip=True)

                    # Extract author
                    author = "Bangkok Post"

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
                print(f"⚠️ Bangkok Post feed error for {feed_url}: {e}")
                continue

        print(f"✅ Bangkok Post: Total {len(all_articles)} unique articles from {len(self.feeds)} feeds")

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
                    source='bangkokpost',
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

        print(f"✅ Bangkok Post: Returning {len(results)} relevant articles")
        return results
