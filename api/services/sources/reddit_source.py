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
from api.services.relevance_scorer import relevance_scorer

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
        Search Reddit posts with progressive refinement.

        Uses smart fallback strategy: if initial query returns too few results,
        automatically tries broader searches. Follows GitHub's proven pattern.

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

        # Progressive refinement: if too few results, expand subreddits
        if len(results) < 5 and len(subreddits) < 20:
            print(f"⚡ Progressive refinement: Only {len(results)} results, expanding subreddits")

            expanded_subreddits = self.default_subreddits + [
                'datascience',
                'artificial',
                'devops',
                'sysadmin',
                'aws',
                'docker',
                'kubernetes',
                'react',
                'node',
                'golang'
            ]

            fallback_results = await loop.run_in_executor(
                None,
                self._sync_search,
                query,
                expanded_subreddits,
                sort,
                time_filter,
                limit
            )

            # Combine and deduplicate by URL
            seen_urls = {r.url for r in results}
            for r in fallback_results:
                if r.url not in seen_urls:
                    results.append(r)
                    seen_urls.add(r.url)

            # Re-sort by relevance then score
            results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

        return results[:limit]

    def _sync_search(
        self,
        query: str,
        subreddits: List[str],
        sort: str,
        time_filter: str,
        limit: int
    ) -> List[SearchResult]:
        """
        Synchronous search helper.

        Implements over-fetching + client-side filtering pattern from GitHub source.
        """
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
                        limit=min(limit * 2, 100)  # Over-fetch for relevance filtering
                    )

                    for post in search_results:
                        # Calculate relevance score using unified scorer
                        relevance = relevance_scorer.calculate_relevance(
                            title=post.title,
                            body=post.selftext if post.selftext else '',
                            tags=[],  # Reddit posts don't have tags
                            search_query=query,
                            metadata={
                                'stars': post.score,
                                'year': self._extract_year(post.created_utc),
                                'has_description': bool(post.selftext)
                            }
                        )

                        result = SearchResult(
                            title=post.title,
                            url=f"https://reddit.com{post.permalink}",
                            source='synth/reddit',
                            result_type=SourceType.DISCUSSION,
                            description=post.selftext[:200] if post.selftext else 'No description',
                            author=str(post.author) if post.author else '[deleted]',
                            score=post.score,
                            metadata={
                                'comments': post.num_comments,
                                'subreddit': sub_name,
                                'created_utc': post.created_utc,
                                'relevance_score': relevance
                            }
                        )
                        all_results.append(result)

                except Exception as e:
                    print(f"⚠️ Error searching r/{sub_name}: {e}")
                    continue

            # Sort by relevance first, then by score
            all_results.sort(key=lambda x: (x.metadata.get('relevance_score', 0), x.score), reverse=True)

            # Return top results after filtering
            final_results = all_results[:limit]

            print(f"✅ Reddit: Found {len(final_results)} posts (filtered from {len(all_results)})")
            return final_results

        except Exception as e:
            print(f"❌ Reddit search error: {e}")
            return []

    def _extract_year(self, created_utc: float) -> Optional[int]:
        """Extract year from Reddit's Unix timestamp."""
        if not created_utc:
            return None
        try:
            from datetime import datetime
            dt = datetime.fromtimestamp(created_utc)
            return dt.year
        except:
            return None
