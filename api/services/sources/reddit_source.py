"""
Reddit Source - Implements unified search interface for Reddit.

Maps Reddit API responses to standardized SearchResult format.
Fixes the 'stars' KeyError bug by properly mapping Reddit fields.
"""

import os
import praw
import asyncio
from typing import List, Optional
from dotenv import load_dotenv
from api.services.source_registry import SearchSource, SearchResult, SourceType

load_dotenv()


class RedditSource(SearchSource):
    """Reddit discussion search implementation."""

    def __init__(self):
        """Initialize PRAW Reddit client."""
        self.reddit = self._initialize_praw()
        self.default_subreddits = [
            'programming',
            'webdev',
            'python',
            'javascript',
            'machinelearning',
            'technology',
            'coding',
            'learnprogramming',
            'cybersecurity',
            'netsec'
        ]

    def _initialize_praw(self):
        """Initialize the PRAW Reddit client."""
        client_id = os.getenv('REDDIT_CLIENT_ID')
        client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        username = os.getenv('REDDIT_USERNAME')
        password = os.getenv('REDDIT_PASSWORD')
        user_agent = f'DevPulse:SYNTH:v1.0 (by /u/{username or "devpulse"})'

        if not all([client_id, client_secret, username, password]):
            print("⚠️ Reddit credentials not configured")
            return None

        return praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent=user_agent
        )

    def get_name(self) -> str:
        return 'reddit'

    def get_display_name(self) -> str:
        return 'Reddit'

    def get_source_type(self) -> SourceType:
        return SourceType.DISCUSSION

    def get_capabilities(self) -> dict:
        return {
            'filters': ['subreddits', 'sort', 'time_filter'],
            'supports_sort': True,
            'max_limit': 100,
            'sort_options': ['relevance', 'hot', 'top', 'new', 'comments']
        }

    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Search Reddit posts.

        Args:
            query: Search query
            limit: Max results
            **filters:
                subreddits: List of subreddit names (default: tech subreddits)
                sort: Sort by 'relevance', 'hot', 'top', 'new', 'comments'
                time_filter: For 'top' sort ('hour', 'day', 'week', 'month', 'year', 'all')

        Returns:
            List of SearchResult objects (with score = upvotes, NOT stars)
        """
        if not self.reddit:
            print("❌ Reddit not initialized")
            return []

        # Extract filters
        subreddits = filters.get('subreddits', self.default_subreddits)
        sort = filters.get('sort', 'relevance')
        time_filter = filters.get('time_filter', 'month')

        # Run in thread pool (PRAW is synchronous)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            query,
            subreddits,
            sort,
            time_filter,
            limit
        )

        return results

    def _sync_search(
        self,
        query: str,
        subreddits: List[str],
        sort: str,
        time_filter: str,
        limit: int
    ) -> List[SearchResult]:
        """Synchronous search helper."""
        try:
            all_results = []

            # Search each subreddit
            for sub_name in subreddits:
                try:
                    subreddit = self.reddit.subreddit(sub_name)
                    search_results = subreddit.search(
                        query=query,
                        sort=sort,
                        time_filter=time_filter,
                        limit=limit
                    )

                    for post in search_results:
                        result = SearchResult(
                            title=post.title,
                            url=f"https://reddit.com{post.permalink}",
                            source='synth/reddit',
                            result_type=SourceType.DISCUSSION,
                            description=post.selftext[:200] if post.selftext else 'No description',
                            author=str(post.author) if post.author else '[deleted]',
                            score=post.score,  # Reddit upvotes = score (NOT stars!)
                            metadata={
                                'comments': post.num_comments,
                                'subreddit': sub_name,
                                'created_utc': post.created_utc
                            }
                        )
                        all_results.append(result)

                except Exception as e:
                    print(f"⚠️ Error searching r/{sub_name}: {e}")
                    continue

            # Sort by score and limit
            all_results.sort(key=lambda x: x.score, reverse=True)
            final_results = all_results[:limit]

            print(f"✅ Reddit: Found {len(final_results)} posts")
            return final_results

        except Exception as e:
            print(f"❌ Reddit search error: {e}")
            return []
