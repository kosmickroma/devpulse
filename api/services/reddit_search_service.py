"""
Reddit Search Service - Custom API searches for SYNTH

Provides direct Reddit API access via PRAW for custom searches beyond trending data.
"""

import os
import praw
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class RedditSearchService:
    """Service for searching Reddit posts via PRAW API."""

    def __init__(self):
        """Initialize PRAW Reddit client."""
        self.reddit = self._initialize_praw()

        # Default subreddits to search (tech-focused)
        self.default_subreddits = [
            'programming',
            'webdev',
            'python',
            'javascript',
            'machinelearning',
            'technology',
            'coding',
            'learnprogramming'
        ]

    def _initialize_praw(self):
        """Initialize the PRAW Reddit client using script authentication."""
        client_id = os.getenv('REDDIT_CLIENT_ID')
        client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        username = os.getenv('REDDIT_USERNAME')
        password = os.getenv('REDDIT_PASSWORD')
        user_agent = 'DevPulse:SYNTH:v1.0 (by /u/{})'.format(username or 'devpulse')

        if not all([client_id, client_secret, username, password]):
            raise ValueError("Reddit credentials not configured in environment")

        return praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent=user_agent
        )

    def search_posts(
        self,
        query: str,
        subreddits: Optional[List[str]] = None,
        limit: int = 10,
        sort: str = "relevance",
        time_filter: str = "month"
    ) -> List[Dict]:
        """
        Search Reddit posts across multiple subreddits.

        Args:
            query: Search query (e.g., "AI tutorials", "web frameworks")
            subreddits: List of subreddit names to search (default: tech subreddits)
            limit: Max results to return
            sort: Sort by 'relevance', 'hot', 'top', 'new', 'comments'
            time_filter: Time filter for 'top' sort ('hour', 'day', 'week', 'month', 'year', 'all')

        Returns:
            List of post dictionaries with:
            - title
            - url
            - score (upvotes)
            - comments (count)
            - author
            - subreddit
            - created_utc
        """
        if subreddits is None:
            subreddits = self.default_subreddits

        try:
            all_results = []

            # Search each subreddit
            for sub_name in subreddits:
                try:
                    subreddit = self.reddit.subreddit(sub_name)

                    # Execute search
                    search_results = subreddit.search(
                        query=query,
                        sort=sort,
                        time_filter=time_filter,
                        limit=limit
                    )

                    # Transform results
                    for post in search_results:
                        all_results.append({
                            'title': post.title,
                            'url': f"https://reddit.com{post.permalink}",
                            'score': post.score,
                            'comments': post.num_comments,
                            'author': str(post.author) if post.author else '[deleted]',
                            'subreddit': sub_name,
                            'source': f'synth/reddit',  # Special source tag for SYNTH results
                            'created_utc': post.created_utc,
                            'description': post.selftext[:200] if post.selftext else 'No description',
                        })

                except Exception as e:
                    print(f"⚠️ Error searching r/{sub_name}: {e}")
                    continue

            # Sort by score and limit
            all_results.sort(key=lambda x: x['score'], reverse=True)
            final_results = all_results[:limit]

            print(f"✅ Found {len(final_results)} Reddit posts for query: {query}")
            return final_results

        except Exception as e:
            print(f"❌ Reddit search error: {e}")
            return []

    def get_hot_posts(
        self,
        subreddits: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get hot posts from specified subreddits (fallback for non-search queries).

        Args:
            subreddits: List of subreddit names
            limit: Max results to return

        Returns:
            List of hot post dictionaries
        """
        if subreddits is None:
            subreddits = self.default_subreddits

        try:
            all_results = []

            for sub_name in subreddits:
                try:
                    subreddit = self.reddit.subreddit(sub_name)
                    hot_posts = subreddit.hot(limit=limit)

                    for post in hot_posts:
                        all_results.append({
                            'title': post.title,
                            'url': f"https://reddit.com{post.permalink}",
                            'score': post.score,
                            'comments': post.num_comments,
                            'author': str(post.author) if post.author else '[deleted]',
                            'subreddit': sub_name,
                            'source': 'synth/reddit',
                            'created_utc': post.created_utc,
                            'description': post.selftext[:200] if post.selftext else 'No description',
                        })

                except Exception as e:
                    print(f"⚠️ Error fetching hot from r/{sub_name}: {e}")
                    continue

            # Sort by score and limit
            all_results.sort(key=lambda x: x['score'], reverse=True)
            return all_results[:limit]

        except Exception as e:
            print(f"❌ Reddit hot posts error: {e}")
            return []
