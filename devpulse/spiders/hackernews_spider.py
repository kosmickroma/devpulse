"""Hacker News spider for scraping front page stories."""

from typing import Generator, Optional
import re

import scrapy
from scrapy.http import Response


class HackernewsSpider(scrapy.Spider):
    """
    Spider for scraping stories from Hacker News front page.

    Hacker News is extremely scraper-friendly with clean HTML structure.
    """

    name = "hackernews"
    allowed_domains = ["news.ycombinator.com"]

    custom_settings = {
        'ROBOTSTXT_OBEY': True,
        'DOWNLOAD_DELAY': 1,  # HN is okay with reasonable scraping
    }

    def __init__(self, page_limit: int = 1, *args, **kwargs):
        """
        Initialize the spider.

        Args:
            page_limit: Number of pages to scrape (each page has ~30 stories)
        """
        super().__init__(*args, **kwargs)
        self.page_limit = int(page_limit)
        self.current_page = 1
        self.start_urls = ["https://news.ycombinator.com/"]

    def parse(self, response: Response) -> Generator:
        """
        Parse the Hacker News front page.

        Extracts story title, URL, score, author, and comment count.
        """
        # HN uses table-based layout with class "athing" for stories
        stories = response.css('tr.athing')

        for story in stories:
            story_id = story.css('::attr(id)').get()
            if not story_id:
                continue

            # Extract title and URL
            title_elem = story.css('span.titleline > a')
            title = title_elem.css('::text').get()
            url = title_elem.css('::attr(href)').get()

            if not title or not url:
                continue

            # Make relative URLs absolute
            if url.startswith('item?id='):
                url = f"https://news.ycombinator.com/{url}"

            # Get the next row which contains metadata
            metadata = story.xpath('following-sibling::tr[1]')

            # Extract score
            score = self._extract_score(metadata)

            # Extract author
            author = metadata.css('a.hnuser::text').get()

            # Extract comment count
            comments = self._extract_comments(metadata)

            yield {
                'title': title.strip(),
                'url': url,
                'source': 'hackernews',
                'description': None,  # HN doesn't show descriptions on front page
                'language': None,
                'author': author,
                'stars': None,
                'comments': comments,
                'score': score,
                'reactions': None,
                'category': 'article'
            }

        # Handle pagination
        if self.current_page < self.page_limit:
            next_link = response.css('a.morelink::attr(href)').get()
            if next_link:
                self.current_page += 1
                self.logger.info(f"Following pagination to page {self.current_page}")
                yield response.follow(next_link, callback=self.parse)

    def _extract_score(self, metadata) -> Optional[int]:
        """
        Extract story score (points).

        Args:
            metadata: Scrapy selector for metadata row

        Returns:
            Score as integer, or None
        """
        score_text = metadata.css('span.score::text').get()
        if not score_text:
            return None

        # Extract number from text like "123 points"
        match = re.search(r'(\d+)', score_text)
        if match:
            return int(match.group(1))
        return None

    def _extract_comments(self, metadata) -> Optional[int]:
        """
        Extract comment count.

        Args:
            metadata: Scrapy selector for metadata row

        Returns:
            Number of comments, or None
        """
        # Find the comments link
        comments_links = metadata.css('a')
        for link in comments_links:
            link_text = link.css('::text').get()
            if link_text and 'comment' in link_text:
                # Extract number from text like "42 comments" or "discuss"
                match = re.search(r'(\d+)', link_text)
                if match:
                    return int(match.group(1))
                else:
                    # "discuss" means 0 comments
                    return 0
        return None
