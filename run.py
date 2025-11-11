#!/usr/bin/env python3
"""
DevPulse CLI

Track the pulse of developer trends across GitHub, Hacker News, and Dev.to.
"""

import argparse
import csv
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List


class DevPulseCLI:
    """CLI wrapper for DevPulse spiders."""

    AVAILABLE_SPIDERS = ['github_api', 'hackernews', 'devto', 'reddit_api']

    def __init__(self):
        """Initialize the CLI."""
        self.output_dir = Path('output')
        self.output_dir.mkdir(exist_ok=True)

    def run_spider(self, spider_name: str, **kwargs) -> bool:
        """
        Run a single spider.

        Args:
            spider_name: Name of the spider to run
            **kwargs: Spider-specific arguments

        Returns:
            True if successful, False otherwise
        """
        print(f"\n[*] Running {spider_name.upper()} spider...")

        # Build command based on spider type
        cmd = ['scrapy', 'crawl', spider_name]

        if spider_name == 'github_api':
            time_range = kwargs.get('time_range', 'daily')
            language = kwargs.get('language', '')
            print(f"    Time range: {time_range}")
            if language:
                print(f"    Language: {language}")
            cmd.extend(['-a', f'time_range={time_range}'])
            if language:
                cmd.extend(['-a', f'language={language}'])

        elif spider_name == 'hackernews':
            page_limit = kwargs.get('page_limit', 1)
            print(f"    Pages: {page_limit}")
            cmd.extend(['-a', f'page_limit={page_limit}'])

        elif spider_name == 'devto':
            time_range = kwargs.get('time_range', 'week')
            tag = kwargs.get('tag', '')
            print(f"    Time range: {time_range}")
            if tag:
                print(f"    Tag: {tag}")
            cmd.extend(['-a', f'time_range={time_range}'])
            if tag:
                cmd.extend(['-a', f'tag={tag}'])

        elif spider_name == 'reddit_api':
            subreddits = kwargs.get('subreddits', 'programming')
            limit = kwargs.get('limit', 50)
            query = kwargs.get('query', '')
            print(f"    Subreddits: {subreddits}")
            print(f"    Limit: {limit}")
            if query:
                print(f"    Query (Synth Mode): {query}")
            cmd.extend(['-a', f'subreddits_list={subreddits}'])
            cmd.extend(['-a', f'limit={limit}'])
            if query:
                cmd.extend(['-a', f'query={query}'])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode == 0:
                print(f"[+] {spider_name.upper()} spider completed successfully")
                return True
            else:
                print(f"[!] {spider_name.upper()} spider failed")
                if result.stderr:
                    print(f"    Error: {result.stderr[:200]}")
                return False

        except FileNotFoundError:
            print("[!] Error: Scrapy not found. Please install requirements:")
            print("    pip install -r requirements.txt")
            return False
        except Exception as e:
            print(f"[!] Error running {spider_name}: {e}")
            return False

    def run_all_spiders(self, **kwargs) -> List[str]:
        """
        Run all available spiders.

        Args:
            **kwargs: Spider arguments

        Returns:
            List of successful spider names
        """
        print("=" * 60)
        print("DEVPULSE - Track the pulse of developer trends")
        print("=" * 60)

        successful = []
        for spider in self.AVAILABLE_SPIDERS:
            if self.run_spider(spider, **kwargs):
                successful.append(spider)

        return successful

    def show_summary(self):
        """Display summary statistics from the most recent scrape."""
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)

        # Find the most recent CSV file
        csv_files = sorted(self.output_dir.glob('devpulse_*.csv'), reverse=True)

        if not csv_files:
            print("[!] No output files found")
            return

        latest_file = csv_files[0]
        print(f"\nResults saved to: {latest_file.name}")

        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            if not rows:
                print("[!] No items scraped")
                return

            total_items = len(rows)

            # Count by source
            sources = {}
            for row in rows:
                source = row.get('source', 'unknown')
                sources[source] = sources.get(source, 0) + 1

            print(f"\nTotal items scraped: {total_items}")

            print(f"\nItems by source:")
            for source, count in sorted(sources.items()):
                print(f"  {source.capitalize()}: {count} items")

            # Show top trending items
            print(f"\nTop 5 trending items:")
            for i, item in enumerate(rows[:5], 1):
                title = item.get('title', 'Unknown')[:60]
                source = item.get('source', 'unknown')

                # Show relevant metric
                if item.get('stars'):
                    metric = f"⭐ {item['stars']} stars"
                elif item.get('score'):
                    metric = f"▲ {item['score']} points"
                elif item.get('reactions'):
                    metric = f"❤️  {item['reactions']} reactions"
                else:
                    metric = ""

                print(f"  {i}. {title}")
                print(f"     [{source}] {metric}")

        except Exception as e:
            print(f"[!] Error reading results: {e}")

    def main(self):
        """Main CLI entry point."""
        parser = argparse.ArgumentParser(
            description='DevPulse - Track the pulse of developer trends',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog='''
Examples:
  Run all spiders:
    python run.py --all

  Run specific spider:
    python run.py --spider github_api

  GitHub with specific language:
    python run.py --spider github_api --language python

  Hacker News with multiple pages:
    python run.py --spider hackernews --pages 2

  Dev.to with specific tag:
    python run.py --spider devto --tag python

  Reddit Standard Mode (hot posts from saved subreddits):
    python run.py --spider reddit_api --subreddits python,machinelearning --limit 50

  Reddit Synth Mode (AI-powered custom search):
    python run.py --spider reddit_api --subreddits python,machinelearning --query "LLM" --limit 25
            '''
        )

        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all available spiders'
        )

        parser.add_argument(
            '--spider',
            nargs='+',
            choices=self.AVAILABLE_SPIDERS,
            help='Run specific spider(s)'
        )

        parser.add_argument(
            '--time-range',
            choices=['daily', 'weekly', 'monthly', 'week', 'month', 'year'],
            default='daily',
            help='Time range for GitHub/Dev.to (default: daily)'
        )

        parser.add_argument(
            '--language',
            default='',
            help='Programming language for GitHub (e.g., python, javascript)'
        )

        parser.add_argument(
            '--tag',
            default='',
            help='Tag for Dev.to (e.g., python, webdev)'
        )

        parser.add_argument(
            '--pages',
            type=int,
            default=1,
            help='Number of pages for Hacker News (default: 1)'
        )

        parser.add_argument(
            '--subreddits',
            default='programming',
            help='Comma-separated subreddits for Reddit (e.g., python,machinelearning)'
        )

        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Number of posts per subreddit for Reddit (default: 50)'
        )

        parser.add_argument(
            '--query',
            default='',
            help='Search query for Reddit Synth Mode (e.g., "LLM", "arcade games")'
        )

        parser.add_argument(
            '--no-summary',
            action='store_true',
            help='Skip summary statistics'
        )

        args = parser.parse_args()

        # Validate arguments
        if not args.all and not args.spider:
            parser.print_help()
            print("\nError: Please specify --all or --spider")
            sys.exit(1)

        # Build kwargs for spiders
        spider_kwargs = {
            'time_range': args.time_range,
            'language': args.language,
            'tag': args.tag,
            'page_limit': args.pages,
            'subreddits': args.subreddits,
            'limit': args.limit,
            'query': args.query
        }

        # Run spiders
        successful = []
        if args.all:
            successful = self.run_all_spiders(**spider_kwargs)
        elif args.spider:
            for spider in args.spider:
                if self.run_spider(spider, **spider_kwargs):
                    successful.append(spider)

        # Show summary
        if successful and not args.no_summary:
            self.show_summary()

        # Exit with appropriate code
        if successful:
            print(f"\n[+] Completed successfully! ({len(successful)} spider(s))")
            sys.exit(0)
        else:
            print("\n[!] No spiders completed successfully")
            sys.exit(1)


if __name__ == '__main__':
    cli = DevPulseCLI()
    cli.main()
