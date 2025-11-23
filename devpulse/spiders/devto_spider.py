"""Dev.to spider for scraping trending posts."""

from typing import Generator, Optional
import re

import scrapy
from scrapy.http import Response


class DevtoSpider(scrapy.Spider):
    """
    Spider for scraping trending posts from Dev.to.

    Dev.to has a clean, semantic HTML structure that's easy to scrape.
    """

    name = "devto"
    allowed_domains = ["dev.to"]

    custom_settings = {
        'ROBOTSTXT_OBEY': True,
        'DOWNLOAD_DELAY': 0.5,  # Dev.to is developer-friendly, moderate delay
        'CONCURRENT_REQUESTS': 8,  # Allow concurrent scraping
    }

    def __init__(self, time_range: str = "week", tag: str = "", *args, **kwargs):
        """
        Initialize the spider.

        Args:
            time_range: week, month, year, infinity, or latest
            tag: optional tag filter (e.g., "python", "javascript")
        """
        super().__init__(*args, **kwargs)
        self.time_range = time_range
        self.tag = tag

        # Build the URL
        if tag:
            url = f"https://dev.to/t/{tag}/top/{time_range}"
        else:
            url = f"https://dev.to/top/{time_range}"

        self.start_urls = [url]

    def parse(self, response: Response) -> Generator:
        """
        Parse the Dev.to trending page.

        Extracts post title, URL, author, reactions, and comments.
        """
        # Dev.to uses article elements with specific classes
        posts = response.css('article.crayons-story')

        # Alternative selector if the above doesn't work
        if not posts:
            posts = response.css('div.crayons-story')

        for post in posts:
            # Extract title and URL
            title_elem = post.css('h2.crayons-story__title a, h3.crayons-story__title a')
            title = title_elem.css('::text').get()
            url = title_elem.css('::attr(href)').get()

            if not title or not url:
                continue

            # Make URL absolute
            if url.startswith('/'):
                url = f"https://dev.to{url}"

            # Extract author
            author = post.css('a.crayons-story__secondary.fw-medium::text').get()
            if author:
                author = author.strip()

            # Extract reactions (hearts/unicorns/etc.)
            reactions = self._extract_reactions(post)

            # Extract comments count
            comments = self._extract_comments(post)

            # Extract tags to use as description
            tags = post.css('a.crayons-tag::text').getall()
            tags_str = ', '.join([t.strip().lstrip('#') for t in tags]) if tags else None

            yield {
                'title': title.strip(),
                'url': url,
                'source': 'devto',
                'description': f"Tags: {tags_str}" if tags_str else None,
                'language': None,
                'author': author,
                'stars': None,
                'comments': comments,
                'score': None,
                'reactions': reactions,
                'category': 'article'
            }

    def _extract_reactions(self, post) -> Optional[int]:
        """
        Extract total reactions count.

        Args:
            post: Scrapy selector for post element

        Returns:
            Reaction count as integer, or None
        """
        # Reactions are shown with a button/span
        reactions_elem = post.css('span.aggregate_reactions_counter::text').get()

        if not reactions_elem:
            # Try alternative selector
            reactions_elem = post.css('button[aria-label*="reaction"] span::text').get()

        if reactions_elem:
            # Remove any non-digit characters
            reactions_str = re.sub(r'[^\d]', '', reactions_elem)
            try:
                return int(reactions_str) if reactions_str else 0
            except ValueError:
                return None

        return None

    def _extract_comments(self, post) -> Optional[int]:
        """
        Extract comment count.

        Args:
            post: Scrapy selector for post element

        Returns:
            Number of comments, or None
        """
        # Comments shown in link with "Add comment" or "X comments"
        comments_elem = post.css('a[href*="#comments"]::text, a.crayons-btn--ghost-primary::text').getall()

        for text in comments_elem:
            if 'comment' in text.lower():
                # Extract number from text like "42 comments"
                match = re.search(r'(\d+)', text)
                if match:
                    return int(match.group(1))
                else:
                    # "Add comment" means 0 comments
                    return 0

        return None
