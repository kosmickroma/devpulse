"""
Demo Cache Service - Manages cached items for instant demo mode.

Stores 60 most recent items per source, refreshed every 3 hours.
Provides instant burst of 360 items for demo mode.
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import os

# Initialize Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️  WARNING: Supabase not configured for demo cache")


class DemoCacheService:
    """Manages cached items for demo mode instant display."""

    ITEMS_PER_SOURCE = 60
    CACHE_DURATION_HOURS = 3
    SOURCES = ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']

    @staticmethod
    async def get_cached_items_shuffled() -> List[Dict[str, Any]]:
        """
        Get all cached items (up to 60 per source) in randomized order.

        Returns:
            List of 360 items (60 × 6 sources) shuffled randomly
        """
        if not supabase:
            print("⚠️  Supabase not available, returning empty cache")
            return []

        try:
            # Fetch all cached items
            response = supabase.table('cached_demo_items') \
                .select('*') \
                .order('scraped_at', desc=True) \
                .execute()

            if not response.data:
                print("⚠️  No cached items found in database")
                return []

            # Group by source, take top 60 each
            by_source = {}
            for item in response.data:
                source = item['source']
                if source not in by_source:
                    by_source[source] = []
                if len(by_source[source]) < DemoCacheService.ITEMS_PER_SOURCE:
                    by_source[source].append(item['item_data'])

            # Flatten and shuffle
            all_items = []
            for source_items in by_source.values():
                all_items.extend(source_items)

            random.shuffle(all_items)

            print(f"✅ Loaded {len(all_items)} cached items from {len(by_source)} sources")
            return all_items

        except Exception as e:
            print(f"❌ Error fetching cached items: {e}")
            return []

    @staticmethod
    async def store_scan_results(source: str, items: List[Dict[str, Any]]) -> bool:
        """
        Store scan results for a source (keeping only top 60).

        Args:
            source: Source name (github, reddit, etc.)
            items: List of items to cache

        Returns:
            True if successful, False otherwise
        """
        if not supabase:
            print("⚠️  Supabase not available, cannot store cache")
            return False

        try:
            # Delete old items for this source
            supabase.table('cached_demo_items') \
                .delete() \
                .eq('source', source) \
                .execute()

            # Take only top 60 items
            items_to_store = items[:DemoCacheService.ITEMS_PER_SOURCE]

            # Prepare items for insertion
            cached_items = []
            for rank, item in enumerate(items_to_store, start=1):
                cached_items.append({
                    'source': source,
                    'item_data': item,
                    'scraped_at': datetime.now().isoformat(),
                    'rank': rank
                })

            # Batch insert
            if cached_items:
                supabase.table('cached_demo_items').insert(cached_items).execute()
                print(f"✅ Stored {len(cached_items)} items for {source}")
                return True

            return False

        except Exception as e:
            print(f"❌ Error storing cached items for {source}: {e}")
            return False

    @staticmethod
    async def refresh_all_sources():
        """
        Refresh cache for all sources by running a full scan.
        Should be called every 3 hours via background task.
        """
        from api.spider_runner import SpiderRunner

        print(f"🔄 Starting cache refresh at {datetime.now()}")

        spider_runner = SpiderRunner()
        sources_map = {
            'github_api': 'github',
            'reddit_api': 'reddit',
            'hackernews': 'hackernews',
            'devto': 'devto',
            'yahoo_finance': 'stocks',
            'coingecko': 'crypto'
        }

        for spider_name, source_key in sources_map.items():
            try:
                print(f"📡 Refreshing {source_key}...")
                items = []

                # Run spider and collect items
                async for event in spider_runner.run_spider_async(spider_name):
                    if event.get('type') == 'item':
                        items.append(event['data'])

                # Store in cache
                if items:
                    await DemoCacheService.store_scan_results(source_key, items)
                else:
                    print(f"⚠️  No items returned from {source_key}")

            except Exception as e:
                print(f"❌ Error refreshing {source_key}: {e}")

        print(f"✅ Cache refresh complete at {datetime.now()}")

    @staticmethod
    async def get_cache_stats() -> Dict[str, Any]:
        """
        Get statistics about cached items.

        Returns:
            Dict with cache stats (count per source, last updated, etc.)
        """
        if not supabase:
            return {"error": "Supabase not available"}

        try:
            response = supabase.table('cached_demo_items') \
                .select('source, scraped_at') \
                .execute()

            if not response.data:
                return {"total": 0, "by_source": {}, "oldest": None, "newest": None}

            # Count by source
            by_source = {}
            timestamps = []

            for item in response.data:
                source = item['source']
                by_source[source] = by_source.get(source, 0) + 1
                timestamps.append(item['scraped_at'])

            return {
                "total": len(response.data),
                "by_source": by_source,
                "oldest": min(timestamps) if timestamps else None,
                "newest": max(timestamps) if timestamps else None
            }

        except Exception as e:
            return {"error": str(e)}


# Synth Mode Demo Cache
class SynthDemoCacheService:
    """Manages pre-cached Synth search results for demo mode."""

    # Pre-generated Synth demo response
    DEMO_QUERY = "best terminal tools for developers"
    DEMO_RESPONSE = {
        "query": "best terminal tools for developers",
        "summary": "Yo! I just scanned 47 totally radical discussions across GitHub, Reddit, and Hacker News. Devs are LOVING these terminal productivity boosters right now! 🎸 The community is super stoked about modern CLI tools that make the classic terminal experience way more awesome.",
        "results": [
            {
                "title": "starship/starship - The minimal, blazing-fast, and infinitely customizable prompt",
                "url": "https://github.com/starship/starship",
                "source": "github",
                "description": "Starship is a cross-shell prompt that's fast, customizable, and shows you the information you need",
                "stars": 42500,
                "language": "Rust",
                "category": "repository"
            },
            {
                "title": "I switched to tmux and doubled my productivity",
                "url": "https://reddit.com/r/programming/tmux",
                "source": "reddit",
                "description": "Terminal multiplexer that lets you switch between programs, detach and reattach sessions",
                "score": 2847,
                "comments": 412,
                "category": "discussion"
            },
            {
                "title": "fzf: A command-line fuzzy finder",
                "url": "https://github.com/junegunn/fzf",
                "source": "github",
                "description": "General-purpose command-line fuzzy finder that can be used with any list",
                "stars": 58900,
                "language": "Go",
                "category": "repository"
            },
            {
                "title": "The best CLI tools you're not using",
                "url": "https://news.ycombinator.com/item?id=39876543",
                "source": "hackernews",
                "description": "Discussion about modern alternatives to classic Unix tools",
                "score": 1243,
                "comments": 389,
                "category": "article"
            },
            {
                "title": "zoxide - A smarter cd command",
                "url": "https://github.com/ajeetdsouza/zoxide",
                "source": "github",
                "description": "A faster way to navigate your filesystem, inspired by z and autojump",
                "stars": 18700,
                "language": "Rust",
                "category": "repository"
            },
            {
                "title": "bat - A cat clone with wings",
                "url": "https://github.com/sharkdp/bat",
                "source": "github",
                "description": "Syntax highlighting and Git integration for your terminal",
                "stars": 46300,
                "language": "Rust",
                "category": "repository"
            }
        ]
    }

    @staticmethod
    async def get_demo_search_result() -> Dict[str, Any]:
        """
        Get pre-cached Synth search result for demo mode.

        Returns:
            Dict with query, summary, and results
        """
        return SynthDemoCacheService.DEMO_RESPONSE
