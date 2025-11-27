"""
BBC News Source - Implements unified search interface for BBC News.

Fetches news articles from BBC RSS feeds (world, uk, main).
Based on POC: BBC News RSS multi-feed spider (2025-11-27)
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


class BBCNewsSource(SearchSource):
    """BBC News search implementation using RSS feeds."""

    def __init__(self):
        """Initialize BBC News RSS feeds."""
        self.feeds = [
            "https://feeds.bbci.co.uk/news/world/rss.xml",
            "https://feeds.bbci.co.uk/news/uk/rss.xml",
            "https://feeds.bbci.co.uk/news/rss.xml",
        ]

    def get_name(self) -> str:
        return 'bbc'

    def get_display_name(self) -> str:
        return 'BBC News'

    def get_source_type(self) -> SourceType:
        return SourceType.ARTICLE

    def get_capabilities(self) -> dict:
        return {
            'filters': [],
            'supports_sort': False,
            'max_limit': 88  # Realistic limit from 3 feeds
        }

    async def search(
        self,
        query: str,
        limit: int = 30,
        **filters
    ) -> List[SearchResult]:
        """
        Search BBC News articles with relevance scoring.

        Fetches from 3 RSS feeds, deduplicates, and filters by relevance.

        Args:
            query: Search query (filters results by relevance)
            limit: Max results to return (default 30)
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

        Fetches articles from all BBC RSS feeds, deduplicates by URL,
        and applies relevance scoring.
        """
        all_articles = []
        seen_urls = set()

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/131.0 Safari/537.36 DevPulseBot/1.0'
        }

        # Fetch from all feeds
        for feed_url in self.feeds:
            try:
                response = requests.get(feed_url, headers=headers, timeout=15)

                if response.status_code != 200:
                    print(f"⚠️ BBC feed error: {response.status_code} for {feed_url}")
                    continue

                soup = BeautifulSoup(response.content, 'xml')
                items = soup.find_all('item')

                feed_name = feed_url.split('/')[-2] if '/' in feed_url else 'main'
                print(f"✅ BBC: Found {len(items)} items in {feed_name} feed")

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

                    # Extract description (clean HTML entities)
                    description = "No description available"
                    desc = item.find('description')
                    if desc and desc.string:
                        raw = html.unescape(desc.string)
                        clean = BeautifulSoup(raw, 'html.parser')
                        description = clean.get_text(separator=' ', strip=True)

                    # Extract author
                    author = "BBC News"
                    creator = item.find('dc:creator')
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
                        except Exception as e:
                            # Fail gracefully if date parsing fails
                            pass

                    all_articles.append({
                        'title': title,
                        'url': url,
                        'description': description,
                        'author': author,
                        'created_at': created_at
                    })

            except Exception as e:
                print(f"⚠️ BBC feed error for {feed_url}: {e}")
                continue

        print(f"✅ BBC: Total {len(all_articles)} unique articles from {len(self.feeds)} feeds")

        # Apply relevance scoring
        results = []
        for article in all_articles:
            score = relevance_scorer.calculate_relevance(
                search_query=query,
                title=article['title'],
                body=article['description']
            )

            # BBC is general news, so use moderate threshold
            # Allow broader relevance than gaming-specific sources (0.01)
            # but still filter out completely irrelevant articles
            if score > 0.05 or len(query.split()) <= 2:
                result = SearchResult(
                    title=article['title'],
                    url=article['url'],
                    source='bbc',
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

        print(f"✅ BBC: Returning {len(results)} relevant articles")
        return results
