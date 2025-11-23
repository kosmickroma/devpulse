"""
Spider runner for executing Scrapy spiders asynchronously and streaming results in real-time.
Now with true real-time streaming (no more waiting for spider to finish).
"""

import asyncio
import json
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Optional, Dict, Any
from datetime import datetime


class SpiderRunner:
    """Runs Scrapy spiders and streams results line-by-line as they are written."""

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
        Run a Scrapy spider and yield items in real-time as they are scraped.
        """

        # Create temporary JSONL file
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.jsonl', delete=False) as tmp:
            tmp_path = tmp.name
        tmp_file = Path(tmp_path)

        try:
            # Build Scrapy command
            cmd = [
                "scrapy", "crawl", spider_name,
                "-o", tmp_path,
                "--loglevel=ERROR"  # Keep logs quiet
            ]

            # Spider-specific arguments
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
            elif spider_name == "reddit_api":
                cmd.extend(["-a", "subreddits_list=programming,python,machinelearning"])
                cmd.extend(["-a", "limit=50"])
            elif spider_name == "yahoo_finance":
                cmd.extend(["-a", "category=trending"])
            elif spider_name == "coingecko":
                cmd.extend(["-a", "category=trending"])

            # Notify frontend
            yield {
                "type": "connecting",
                "spider": spider_name,
                "message": f"Connecting to {self._get_display_name(spider_name)}..."
            }
            await asyncio.sleep(0.1)

            # Start Scrapy process
            import time
            start_time = time.time()
            print(f"🚀 [{start_time:.2f}] {spider_name}: Launching Scrapy process")

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_root)
            )

            launch_time = time.time() - start_time
            print(f"✅ [{time.time():.2f}] {spider_name}: Process started (+{launch_time:.2f}s)")

            yield {
                "type": "scanning",
                "spider": spider_name,
                "message": f"Scanning {self._get_display_name(spider_name)}..."
            }

            # Real-time tail-follow the output file
            last_pos = 0
            item_count = 0
            first_write_time = None
            first_item_time = None

            while True:
                if not tmp_file.exists():
                    await asyncio.sleep(0.1)
                    if process.returncode is not None:
                        break
                    continue

                current_size = tmp_file.stat().st_size

                if current_size > last_pos:
                    if first_write_time is None:
                        first_write_time = time.time()
                        elapsed = first_write_time - start_time
                        print(f"📝 [{first_write_time:.2f}] {spider_name}: FIRST FILE WRITE detected! (+{elapsed:.2f}s, size: {current_size} bytes)")

                    with open(tmp_path, 'r', encoding='utf-8') as f:
                        f.seek(last_pos)
                        lines = f.readlines()
                        last_pos = f.tell()

                        for line in lines:
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                item = json.loads(line)
                                item_count += 1

                                if first_item_time is None:
                                    first_item_time = time.time()
                                    elapsed = first_item_time - start_time
                                    print(f"🎉 [{first_item_time:.2f}] {spider_name}: FIRST ITEM parsed! (+{elapsed:.2f}s)")

                                yield {
                                    "type": "item",
                                    "spider": spider_name,
                                    "data": self._format_item(item)
                                }
                            except json.JSONDecodeError:
                                continue  # Skip malformed lines

                # Check if spider finished
                if process.returncode is not None:
                    # One final sweep in case anything was missed
                    if tmp_file.exists() and tmp_file.stat().st_size > last_pos:
                        with open(tmp_path, 'r', encoding='utf-8') as f:
                            f.seek(last_pos)
                            for line in f:
                                line = line.strip()
                                if line:
                                    try:
                                        item = json.loads(line)
                                        item_count += 1
                                        yield {
                                            "type": "item",
                                            "spider": spider_name,
                                            "data": self._format_item(item)
                                        }
                                    except json.JSONDecodeError:
                                        pass
                    break

                await asyncio.sleep(0.15)  # Poll every 150ms

            # Final status
            total_time = time.time() - start_time
            if item_count == 0:
                print(f"⚠️  [{time.time():.2f}] {spider_name}: Completed with 0 items (total: {total_time:.2f}s)")
                yield {
                    "type": "warning",
                    "spider": spider_name,
                    "message": f"No items found for {self._get_display_name(spider_name)}"
                }
            else:
                print(f"✅ [{time.time():.2f}] {spider_name}: Completed with {item_count} items")
                print(f"   └─ Total time: {total_time:.2f}s | First write: +{first_write_time-start_time:.2f}s | First item: +{first_item_time-start_time:.2f}s")

        except Exception as e:
            yield {
                "type": "error",
                "spider": spider_name,
                "message": f"Spider error: {str(e)}"
            }
        finally:
            # Always clean up
            if tmp_file.exists():
                try:
                    tmp_file.unlink()
                except:
                    pass

    def _format_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Format Scrapy item for frontend."""
        return {
            "id": f"{item.get('source', 'unknown')}-{hash(item.get('url', ''))}",
            "title": item.get("title", "No title"),
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
        """Human-readable name for spider."""
        names = {
            "github_api": "GitHub",
            "hackernews": "Hacker News",
            "devto": "Dev.to",
            "reddit_api": "Reddit",
            "yahoo_finance": "Yahoo Finance",
            "coingecko": "CoinGecko"
        }
        return names.get(spider_name, spider_name.replace("_", " ").title())
