"""Data pipelines for cleaning, validating, and exporting scraped items."""

import csv
import hashlib
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Set

from itemadapter import ItemAdapter
from pydantic import ValidationError
from scrapy import Spider
from scrapy.exceptions import DropItem

from devpulse.items import TrendingItem


class ValidationPipeline:
    """
    Validates scraped items using Pydantic models.

    Ensures all items conform to the TrendingItem schema.
    """

    def process_item(self, item: Dict[str, Any], spider: Spider) -> Dict[str, Any]:
        """
        Validate item using Pydantic model.

        Args:
            item: Scraped item dictionary
            spider: The spider that scraped this item

        Returns:
            Validated item dictionary

        Raises:
            DropItem: If validation fails
        """
        try:
            # Validate and convert to Pydantic model
            validated = TrendingItem(**item)
            # Convert back to dict for further processing
            return validated.model_dump()
        except ValidationError as e:
            spider.logger.error(f"Validation failed for item: {e}")
            raise DropItem(f"Invalid item: {e}")


class CleaningPipeline:
    """
    Cleans and normalizes trending content data.

    Handles text cleaning and data normalization.
    """

    def process_item(self, item: Dict[str, Any], spider: Spider) -> Dict[str, Any]:
        """
        Clean and normalize item data.

        Args:
            item: Item to clean
            spider: The spider that scraped this item

        Returns:
            Cleaned item dictionary
        """
        adapter = ItemAdapter(item)

        # Clean title: remove extra whitespace, newlines
        if adapter.get('title'):
            title = adapter['title']
            # Remove multiple spaces and newlines
            title = re.sub(r'\s+', ' ', title)
            # Remove special characters that might cause issues
            title = title.replace('\n', ' ').replace('\r', '').strip()
            adapter['title'] = title

        # Clean description
        if adapter.get('description'):
            description = adapter['description']
            description = re.sub(r'\s+', ' ', description).strip()
            adapter['description'] = description

        # Clean author name
        if adapter.get('author'):
            author = adapter['author']
            author = re.sub(r'\s+', ' ', author).strip()
            adapter['author'] = author

        # Normalize source name to lowercase
        if adapter.get('source'):
            adapter['source'] = adapter['source'].lower()

        return item


class DuplicatesPipeline:
    """
    Removes duplicate trending content based on URL.

    Uses URL as the primary deduplication key since URLs are unique identifiers.
    """

    def __init__(self):
        """Initialize the pipeline."""
        self.seen_urls: Set[str] = set()

    def process_item(self, item: Dict[str, Any], spider: Spider) -> Dict[str, Any]:
        """
        Check for duplicate items.

        Args:
            item: Item to check
            spider: The spider that scraped this item

        Returns:
            Item if not duplicate

        Raises:
            DropItem: If item is a duplicate
        """
        adapter = ItemAdapter(item)

        # Use URL as the unique identifier
        url = adapter.get('url', '')

        # Normalize URL (remove query params for comparison)
        normalized_url = url.split('?')[0].lower()

        if normalized_url in self.seen_urls:
            raise DropItem(f"Duplicate item found: {adapter.get('title')}")

        self.seen_urls.add(normalized_url)
        return item


class ExportPipeline:
    """
    Exports items to CSV file with timestamp.

    Creates a new CSV file for each scraping session.
    """

    def __init__(self):
        """Initialize the pipeline."""
        self.file = None
        self.writer = None
        self.items_count = 0

    def open_spider(self, spider: Spider):
        """
        Open CSV file when spider starts.

        Args:
            spider: The spider being opened
        """
        # Create output directory if it doesn't exist
        output_dir = Path('output')
        output_dir.mkdir(exist_ok=True)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = output_dir / f"devpulse_{timestamp}.csv"

        spider.logger.info(f"Exporting results to {filename}")

        # Open file and create CSV writer
        self.file = open(filename, 'w', newline='', encoding='utf-8')
        self.writer = csv.DictWriter(
            self.file,
            fieldnames=['title', 'url', 'source', 'author', 'description',
                        'language', 'stars', 'score', 'comments', 'reactions',
                        'category', 'timestamp']
        )
        self.writer.writeheader()

    def close_spider(self, spider: Spider):
        """
        Close CSV file when spider closes.

        Args:
            spider: The spider being closed
        """
        if self.file:
            self.file.close()
            spider.logger.info(f"Exported {self.items_count} items")

    def process_item(self, item: Dict[str, Any], spider: Spider) -> Dict[str, Any]:
        """
        Write item to CSV file.

        Args:
            item: Item to export
            spider: The spider that scraped this item

        Returns:
            The item (unchanged)
        """
        if self.writer:
            # Convert timestamp to string for CSV
            item_copy = dict(item)
            if isinstance(item_copy.get('timestamp'), datetime):
                item_copy['timestamp'] = item_copy['timestamp'].isoformat()

            self.writer.writerow(item_copy)
            self.items_count += 1

        return item
