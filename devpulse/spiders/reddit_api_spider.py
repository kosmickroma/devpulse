"""
Reddit API spider for fetching posts from subreddits using PRAW.

Supports two modes:
1. 'Standard Mode' (default): Fetches 'Hot' posts from specified subreddits (user preferences)
2. 'Synth Mode' (when 'query' is provided): Searches subreddits for a specific query (AI-powered search)

This dual-mode approach allows both regular feed updates and on-demand custom searches.
"""

import os
from typing import Generator
from dotenv import load_dotenv

import scrapy
import praw  # The Python Reddit API Wrapper

# Critical Step: Load environment variables from .env file immediately
load_dotenv()

class RedditApiSpider(scrapy.Spider):
    """
    Spider for fetching posts from Reddit subreddits using the PRAW API Wrapper.

    Supports two modes:
    1. 'Standard Mode' (default): Fetches 'Hot' posts from specified subreddits.
    2. 'Synth Mode' (when 'query' is provided): Searches subreddits for a specific query.

    Example usage:
        # Standard mode (hot posts from user's saved subreddits)
        scrapy crawl reddit_api -a subreddits_list="python,machinelearning" -a limit=50

        # Synth mode (AI-powered custom search)
        scrapy crawl reddit_api -a subreddits_list="python,machinelearning" -a query="LLM" -a limit=25
    """

    name = "reddit_api"

    # Set required Scrapy settings for non-HTTP API usage
    custom_settings = {
        'ROBOTSTXT_OBEY': False,  # Not applicable for API interaction
        'DOWNLOAD_DELAY': 0,  # PRAW handles its own rate limiting efficiently
        'CONCURRENT_REQUESTS': 16,  # PRAW handles concurrency internally
    }

    def __init__(self, subreddits_list: str = "programming", limit: int = 50, query: str = None, *args, **kwargs):
        """
        Initialize the spider and PRAW client.

        Args:
            subreddits_list: Comma-separated string of subreddit names (e.g., 'python,datascience').
            limit: The maximum number of posts to fetch per subreddit.
            query: The search term to use (if provided, activates 'Synth Mode' for custom search).
        """
        super().__init__(*args, **kwargs)

        # Parse and clean the comma-separated list into self.subreddits list
        self.subreddits = [
            s.strip().lower().replace('r/', '')
            for s in subreddits_list.split(',')
            if s.strip()
        ]

        self.limit = int(limit)

        # Store the query argument, which enables 'Synth Mode'
        self.query = query if query and query.strip() else None

        # Ensure we have at least one subreddit
        if not self.subreddits:
            self.logger.warning("No valid subreddits provided. Defaulting to 'programming'.")
            self.subreddits = ['programming']

        # Initialize PRAW client
        self.reddit = self._initialize_praw()

    def _initialize_praw(self):
        """Initializes the PRAW Reddit client using script authentication."""
        client_id = os.getenv('REDDIT_CLIENT_ID')
        client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        username = os.getenv('REDDIT_USERNAME')
        password = os.getenv('REDDIT_PASSWORD')

        # Check for all four required credentials
        if not all([client_id, client_secret, username, password]):
            self.logger.error("Reddit API credentials (CLIENT_ID, SECRET, USERNAME, PASSWORD) not found in environment. Cannot proceed.")
            return None

        self.logger.info("Initializing PRAW with script credentials...")

        # PRAW handles the authentication handshake (script/password grant flow)
        return praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            # User agent is required by Reddit API rules
            user_agent=f'DevPulse-Scraper-V1 by /u/{username}',
        )

    def start_requests(self) -> Generator:
        """
        Implements the dual-mode logic to either fetch 'hot' posts or search posts
        by iterating over all defined subreddits.
        """
        if not self.reddit:
            return

        # Determine if we are in Synth mode (custom search)
        is_synth_mode = self.query is not None
        mode_name = 'Synth Mode (AI Search)' if is_synth_mode else 'Standard Mode (Hot Posts)'

        self.logger.info(f"Starting Reddit spider in '{mode_name}' for subreddits: {', '.join(self.subreddits)}")

        # Iterate over all subreddits in self.subreddits
        for sub_name in self.subreddits:
            try:
                subreddit = self.reddit.subreddit(sub_name)

                if is_synth_mode:
                    self.logger.info(f"Searching r/{sub_name} for query: '{self.query}' (Limit: {self.limit})")
                    # Use .search() if in Synth mode
                    submissions = subreddit.search(self.query, limit=self.limit)
                else:
                    self.logger.info(f"Fetching 'Hot' posts from r/{sub_name} (Limit: {self.limit})")
                    # Use .hot() if in Standard mode
                    submissions = subreddit.hot(limit=self.limit)

                # Iterate through PRAW's generator and yield the parsed item
                for submission in submissions:
                    # Check if submission is a valid object (can happen with deleted posts)
                    if submission and submission.title:
                        # Pass sub_name and is_synth_mode to the parser
                        yield self._parse_submission(submission, sub_name, is_synth_mode)

            except Exception as e:
                # Handle potential PRAW/API errors (e.g., SubredditNotFound)
                self.logger.error(f"Error fetching data from r/{sub_name} via Reddit API: {e}")

    def _parse_submission(self, submission, sub_name: str, is_synth_mode: bool) -> dict:
        """
        Converts a PRAW Submission object into the standardized DevPulse output dictionary.
        """

        # 1. Determine URL: use permalink for self-posts, or external URL for links
        post_url = f"https://www.reddit.com{submission.permalink}" if submission.is_self else submission.url

        # 2. Truncate description: max 200 chars from selftext
        description = None
        if submission.selftext:
            text = submission.selftext.strip()
            if text:
                description = text[:200]
                if len(text) > 200:
                    description += '...'

        # 3. Determine source: append search query if in Synth mode
        source = f'reddit/{sub_name}'
        if is_synth_mode:
            source += f'/search:{self.query}'

        # 4. Determine category: 'discussion' (self-post) or 'article' (link post)
        category = 'discussion' if submission.is_self else 'article'

        # 5. Handle deleted author
        author_name = submission.author.name if submission.author else '[deleted]'

        # Final dictionary structure matching DevPulse format
        return {
            'title': submission.title,
            'url': post_url,
            'source': source,
            'description': description,
            'language': None,  # Placeholder: PRAW doesn't easily expose this
            'author': author_name,
            'stars': None,     # Not applicable for Reddit
            'comments': submission.num_comments,
            'score': submission.score,
            'category': category
        }
