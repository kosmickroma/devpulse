"""
Spider runner for executing Scrapy spiders asynchronously and streaming results.
"""

import asyncio
import subprocess
import json
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Optional, Dict, Any
from datetime import datetime


class SpiderRunner:
    """Runs Scrapy spiders and streams results in real-time."""

    def __init__(self):
        """Initialize the spider runner."""
        self.project_root = Path(__file__).parent.parent

    async def run_spider_async(
        self,
        spider_name: str,
        language: Optional[str] = None,
        time_range: str = "daily",
        search_query: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Run a Scrapy spider asynchronously and yield results as they come in.

        Args:
            spider_name: Name of the spider to run
            language: Programming language filter (GitHub only)
            time_range: Time range filter (daily, weekly, monthly)
            search_query: Custom search query (GitHub only)

        Yields:
            Dictionary events with spider results
        """

        # Create temporary file for JSON output
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.jsonl', delete=False) as tmp:
            tmp_path = tmp.name

        try:
            # Build Scrapy command
            cmd = [
                "scrapy", "crawl", spider_name,
                "-o", tmp_path,  # Scrapy auto-detects JSON Lines from .jsonl extension
            ]

            # Add spider-specific arguments
            if spider_name == "github_api":
                cmd.extend(["-a", f"time_range={time_range}"])
                if language:
                    cmd.extend(["-a", f"language={language}"])
                if search_query:
                    cmd.extend(["-a", f"search_query={search_query}"])
            elif spider_name == "devto":
                cmd.extend(["-a", f"time_range={time_range}"])
            elif spider_name == "hackernews":
                cmd.extend(["-a", "page_limit=1"])
            elif spider_name == "yahoo_finance":
                # Default to trending, can be: trending, gainers, losers, most_active
                category = "trending"
                cmd.extend(["-a", f"category={category}"])
            elif spider_name == "coingecko":
                # Default to trending, can be: trending, top, gainers, losers
                category = "trending"
                cmd.extend(["-a", f"category={category}"])

            # Send connection status
            yield {
                "type": "connecting",
                "spider": spider_name,
                "message": f"Connecting to {self._get_display_name(spider_name)}..."
            }

            # Run Scrapy process
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_root)
            )

            # Send scanning status
            yield {
                "type": "scanning",
                "spider": spider_name,
                "message": f"Scanning {self._get_display_name(spider_name)}..."
            }

            # Wait for process to complete
            await process.wait()

            # Read results from temporary file
            tmp_file = Path(tmp_path)
            if tmp_file.exists() and tmp_file.stat().st_size > 0:
                with open(tmp_path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        if line.strip():
                            try:
                                item = json.loads(line)
                                # Convert to frontend format
                                yield {
                                    "type": "item",
                                    "spider": spider_name,
                                    "data": self._format_item(item),
                                    "progress": None  # Can add progress tracking if needed
                                }
                            except json.JSONDecodeError:
                                continue

            # Clean up temp file
            tmp_file.unlink(missing_ok=True)

        except Exception as e:
            yield {
                "type": "error",
                "spider": spider_name,
                "message": f"Error running {spider_name}: {str(e)}"
            }

    def _format_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format Scrapy item for frontend consumption.

        Args:
            item: Raw item from Scrapy

        Returns:
            Formatted item matching frontend TrendingItem interface
        """
        return {
            "id": f"{item['source']}-{hash(item['url'])}",
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "source": item.get("source", ""),
            "author": item.get("author"),
            "description": item.get("description"),
            "language": item.get("language"),
            "stars": item.get("stars"),
            "score": item.get("score"),
            "comments": item.get("comments"),
            "reactions": item.get("reactions"),
            "category": item.get("category", "article"),
            "scrapedAt": datetime.now().isoformat(),
            "isNew": True
        }

    def _get_display_name(self, spider_name: str) -> str:
        """Get human-readable display name for spider."""
        names = {
            "github_api": "GitHub",
            "hackernews": "Hacker News",
            "devto": "Dev.to",
            "yahoo_finance": "Yahoo Finance",
            "coingecko": "CoinGecko"
        }
        return names.get(spider_name, spider_name)
