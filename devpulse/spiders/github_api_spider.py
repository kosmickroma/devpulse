"""
GitHub API spider for fetching trending repositories.

Uses GitHub's Search API to simulate trending behavior by searching
for recently created/updated repositories sorted by stars.

This replaces the HTML scraping approach which was blocked by robots.txt.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Generator, Optional
from dotenv import load_dotenv

import scrapy
from scrapy.http import Response


class GithubApiSpider(scrapy.Spider):
    """
    Spider for fetching trending repositories via GitHub API.

    Uses Search API with date filters and star sorting to approximate
    the trending page behavior.

    Rate Limits:
    - Without auth: 60 requests/hour
    - With auth: 5,000 requests/hour
    """

    name = "github_api"
    allowed_domains = ["api.github.com"]

    custom_settings = {
        'ROBOTSTXT_OBEY': False,  # API doesn't use robots.txt
        'DOWNLOAD_DELAY': 1,  # Be respectful to API
    }

    def __init__(self, time_range: str = "daily", language: str = "", *args, **kwargs):
        """
        Initialize the spider.

        Args:
            time_range: daily, weekly, or monthly
            language: programming language filter (empty for all)
        """
        super().__init__(*args, **kwargs)
        self.time_range = time_range
        self.language = language

        # Load GitHub token from .env
        load_dotenv()
        self.github_token = os.getenv('GITHUB_TOKEN', '')

        if not self.github_token or self.github_token == 'PASTE_YOUR_NEW_TOKEN_HERE':
            self.logger.warning(
                "No GitHub token found! Using unauthenticated requests (60/hour limit). "
                "Add your token to .env file for 5,000/hour limit."
            )
            self.github_token = None

        # Build the API URL with search query
        self.start_urls = [self._build_search_url()]

    def _build_search_url(self) -> str:
        """
        Build GitHub Search API URL with appropriate filters.

        Strategy:
        - Search for repos created/updated in the time range
        - Sort by stars (most popular)
        - Filter by language if specified

        Returns:
            Complete API URL with query parameters
        """
        # Calculate date range
        today = datetime.now()

        if self.time_range == "daily":
            since_date = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        elif self.time_range == "weekly":
            since_date = (today - timedelta(days=7)).strftime("%Y-%m-%d")
        elif self.time_range == "monthly":
            since_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        else:
            # Default to daily
            since_date = (today - timedelta(days=1)).strftime("%Y-%m-%d")

        # Build query string
        # Using "created" gives us new repos, "pushed" gives us active repos
        # Let's use pushed for better trending behavior
        query_parts = [f"pushed:>{since_date}"]

        if self.language:
            query_parts.append(f"language:{self.language}")

        # Add stars threshold to filter out low-quality repos
        query_parts.append("stars:>10")

        query = " ".join(query_parts)

        # Build complete URL
        url = (
            f"https://api.github.com/search/repositories"
            f"?q={query}"
            f"&sort=stars"
            f"&order=desc"
            f"&per_page=30"  # Get top 30 trending repos
        )

        self.logger.info(f"Search query: {query}")
        return url

    def start_requests(self):
        """Generate initial requests with authentication headers."""
        headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'DevPulse-Scraper'
        }

        # Add authentication if token is available
        if self.github_token:
            headers['Authorization'] = f'token {self.github_token}'
            self.logger.info("Using authenticated requests (5,000/hour limit)")
        else:
            self.logger.info("Using unauthenticated requests (60/hour limit)")

        for url in self.start_urls:
            yield scrapy.Request(url, headers=headers, callback=self.parse)

    def parse(self, response: Response) -> Generator:
        """
        Parse GitHub API response.

        API returns JSON with repository data.
        """
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON response: {e}")
            self.logger.error(f"Response text: {response.text[:500]}")
            return

        # Check for API errors
        if 'message' in data:
            self.logger.error(f"API Error: {data['message']}")
            if 'documentation_url' in data:
                self.logger.error(f"See: {data['documentation_url']}")
            return

        # Check rate limit info
        if response.headers.get('X-RateLimit-Remaining'):
            remaining = response.headers.get('X-RateLimit-Remaining').decode('utf-8')
            limit = response.headers.get('X-RateLimit-Limit').decode('utf-8')
            self.logger.info(f"Rate limit: {remaining}/{limit} requests remaining")

        # Extract repositories
        items = data.get('items', [])
        total_count = data.get('total_count', 0)

        self.logger.info(f"Found {total_count} repositories matching criteria")
        self.logger.info(f"Returning top {len(items)} repositories")

        for repo in items:
            try:
                # Extract repository data
                full_name = repo.get('full_name', '')
                repo_url = repo.get('html_url', '')
                description = repo.get('description', '')
                language = repo.get('language', None)
                stars = repo.get('stargazers_count', 0)

                # Extract owner as author
                owner = repo.get('owner', {})
                author = owner.get('login', '')

                # Get other metrics
                forks = repo.get('forks_count', 0)
                open_issues = repo.get('open_issues_count', 0)
                watchers = repo.get('watchers_count', 0)

                # Format title like "facebook / react"
                if '/' in full_name:
                    title = full_name.replace('/', ' / ')
                else:
                    title = full_name

                yield {
                    'title': title,
                    'url': repo_url,
                    'source': 'github',
                    'description': description,
                    'language': language,
                    'stars': stars,
                    'author': author,
                    'comments': open_issues,  # Using open issues as "discussion" metric
                    'score': watchers,  # Using watchers as secondary popularity metric
                    'reactions': None,
                    'category': 'repository'
                }

            except Exception as e:
                self.logger.error(f"Error parsing repository: {e}")
                self.logger.error(f"Repository data: {repo}")
                continue
