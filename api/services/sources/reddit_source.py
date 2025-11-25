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

            # Extract search terms for relevance scoring
            search_terms = [t.strip().lower() for t in query.split() if len(t.strip()) > 2]

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
                        # Calculate relevance score
                        relevance = self._calculate_relevance(post, search_terms)

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

    def _calculate_relevance(self, post, search_terms: List[str]) -> float:
        """
        Calculate relevance score for a Reddit post.

        Uses same approach as GitHub source with Reddit-specific adaptations.

        Returns:
            Float score (0-100)
        """
        if not search_terms:
            return 50.0

        score = 0.0
        title = post.title.lower()
        selftext = (post.selftext or '').lower()

        for term in search_terms:
            # Exact title match: highest weight
            if term == title:
                score += 50
            # Title contains term: high weight
            elif term in title:
                score += 30
            # Body contains term: medium weight
            elif term in selftext:
                score += 15

        # Bonus for high engagement
        if post.score > 100:
            score += 10
        elif post.score > 50:
            score += 5

        # Bonus for high comment activity
        if post.num_comments > 50:
            score += 5
        elif post.num_comments > 20:
            score += 3

        # Bonus for having body text
        if post.selftext:
            score += 5

        return min(score, 100.0)
