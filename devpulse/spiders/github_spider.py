"""GitHub Trending spider with robust selector fallbacks."""

from typing import Generator, Optional
import re

import scrapy
from scrapy.http import Response


class GithubSpider(scrapy.Spider):
    """
    Spider for scraping trending repositories from GitHub.

    Uses multiple selector strategies to handle GitHub's frequently changing HTML.
    """

    name = "github"
    allowed_domains = ["github.com"]

    custom_settings = {
        'ROBOTSTXT_OBEY': True,
        'DOWNLOAD_DELAY': 2,
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

        # Build the trending URL
        url = "https://github.com/trending"
        if language:
            url += f"/{language}"
        url += f"?since={time_range}"

        self.start_urls = [url]

    def parse(self, response: Response) -> Generator:
        """
        Parse the GitHub trending page with multiple selector strategies.

        Extracts repository information using fallback selectors.
        """
        # Try multiple selectors for repo containers
        repos = (
            response.css('article.Box-row') or
            response.css('article[id^="repo-"]') or
            response.css('div.Box-row') or
            response.xpath('//article[contains(@class, "Box-row")]')
        )

        if not repos:
            self.logger.warning("No repositories found with any selector strategy")
            return

        for repo in repos:
            try:
                # Extract repository name and URL with fallbacks
                repo_link = (
                    repo.css('h2 a::attr(href)').get() or
                    repo.css('h1 a::attr(href)').get() or
                    repo.xpath('.//h2//a/@href').get() or
                    repo.xpath('.//h1//a/@href').get()
                )

                if not repo_link:
                    self.logger.debug("Could not find repo link")
                    continue

                # Clean and format repo name
                repo_name = repo_link.strip('/').replace('/', ' / ')
                repo_url = f"https://github.com{repo_link}"

                # Extract description with multiple strategies
                description = (
                    repo.css('p.col-9::text').get() or
                    repo.css('p.color-fg-muted::text').get() or
                    repo.css('p[class*="muted"]::text').get() or
                    repo.xpath('.//p[contains(@class, "col-9")]//text()').get() or
                    repo.xpath('.//p[1]/text()').get()
                )

                if description:
                    description = description.strip()

                # Extract language with fallbacks
                language = (
                    repo.css('span[itemprop="programmingLanguage"]::text').get() or
                    repo.css('span.d-inline-block span[itemprop]::text').get() or
                    repo.xpath('.//span[@itemprop="programmingLanguage"]/text()').get()
                )

                if language:
                    language = language.strip()

                # Extract stars with multiple strategies
                stars_total = self._extract_total_stars(repo)
                stars_today = self._extract_stars_today(repo)

                # Extract author from repo name
                author = repo_link.strip('/').split('/')[0] if '/' in repo_link else None

                yield {
                    'title': repo_name,
                    'url': repo_url,
                    'source': 'github',
                    'description': description,
                    'language': language,
                    'stars': stars_total,
                    'author': author,
                    'comments': None,
                    'score': stars_today,  # Using "stars today" as score
                    'reactions': None,
                    'category': 'repository'
                }

            except Exception as e:
                self.logger.error(f"Error parsing repo: {e}")
                continue

    def _extract_stars_today(self, repo) -> Optional[int]:
        """
        Extract the number of stars gained today.

        Args:
            repo: Scrapy selector for repo element

        Returns:
            Stars today as integer, or None
        """
        # Try multiple selectors for "stars today"
        stars_text = (
            repo.css('span.d-inline-block.float-sm-right::text').get() or
            repo.css('span.color-fg-muted.d-inline-block::text').getall()
        )

        if isinstance(stars_text, list):
            # Look for text containing "stars"
            for text in stars_text:
                if 'star' in text.lower():
                    stars_text = text
                    break
            else:
                stars_text = None

        if not stars_text:
            return None

        # Extract number from text like "1,234 stars today"
        match = re.search(r'([\d,]+)\s+stars?', stars_text.replace(',', ''))
        if match:
            try:
                return int(match.group(1).replace(',', ''))
            except ValueError:
                return None
        return None

    def _extract_total_stars(self, repo) -> Optional[int]:
        """
        Extract total repository stars.

        Args:
            repo: Scrapy selector for repo element

        Returns:
            Total stars as integer, or None
        """
        # Try multiple selectors for total stars
        stars_link = (
            repo.css('a[href*="/stargazers"]') or
            repo.xpath('.//a[contains(@href, "/stargazers")]')
        )

        if not stars_link:
            return None

        stars_text = stars_link.css('::text').get()
        if not stars_text:
            return None

        # Remove commas and "k" suffix, convert to int
        stars_text = stars_text.strip().replace(',', '')

        # Handle "k" suffix (e.g., "12.5k" -> 12500)
        if 'k' in stars_text.lower():
            try:
                num = float(stars_text.lower().replace('k', ''))
                return int(num * 1000)
            except ValueError:
                return None

        # Regular number
        try:
            return int(stars_text)
        except ValueError:
            return None
