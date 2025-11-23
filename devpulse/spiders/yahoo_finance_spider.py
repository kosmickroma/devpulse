"""
Yahoo Finance spider for fetching trending stocks and market movers.

Uses Yahoo Finance API to get:
- Trending tickers
- Top gainers/losers
- Most active stocks
"""

import json
from typing import Generator
from datetime import datetime

import scrapy
from scrapy.http import Response


class YahooFinanceSpider(scrapy.Spider):
    """
    Spider for fetching trending stocks from Yahoo Finance.

    Fetches trending tickers, gainers, losers, and most active stocks.
    No API key required.
    """

    name = "yahoo_finance"
    allowed_domains = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]

    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 0,  # Public API, no delay needed
        'CONCURRENT_REQUESTS': 16,  # Yahoo Finance API can handle concurrent requests
        'CONCURRENT_REQUESTS_PER_DOMAIN': 8,
    }

    def __init__(self, category: str = "trending", *args, **kwargs):
        """
        Initialize the spider.

        Args:
            category: trending, gainers, losers, or most_active
        """
        super().__init__(*args, **kwargs)
        self.category = category

        # API endpoints
        self.endpoints = {
            'trending': 'https://query1.finance.yahoo.com/v1/finance/trending/US?count=25',
            'gainers': 'https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=25',
            'losers': 'https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_losers&count=25',
            'most_active': 'https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=most_actives&count=25',
        }

        self.start_urls = [self.endpoints.get(category, self.endpoints['trending'])]

    def start_requests(self):
        """Generate initial requests."""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com',
        }

        for url in self.start_urls:
            yield scrapy.Request(url, headers=headers, callback=self.parse)

    def parse(self, response: Response) -> Generator:
        """Parse Yahoo Finance API response to get trending symbols."""
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON: {e}")
            self.logger.error(f"Response status: {response.status}")
            self.logger.error(f"Response text (first 500 chars): {response.text[:500]}")
            return

        # Get symbols from trending endpoint
        quotes = data.get('finance', {}).get('result', [{}])[0].get('quotes', [])
        symbols = [q.get('symbol') for q in quotes if q.get('symbol')]

        self.logger.info(f"Found {len(symbols)} trending symbols: {symbols[:10]}")

        # Request detailed quote data for each symbol
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://finance.yahoo.com/',
        }

        for symbol in symbols[:15]:  # Limit to 15 to avoid rate limiting
            chart_url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            yield scrapy.Request(chart_url, headers=headers, callback=self.parse_quote)

    def parse_quote(self, response: Response) -> Generator:
        """Parse detailed quote data from chart endpoint."""
        try:
            data = json.loads(response.text)
            result = data.get('chart', {}).get('result', [])

            if not result:
                return

            meta = result[0].get('meta', {})

            symbol = meta.get('symbol', '')
            name = meta.get('longName') or meta.get('shortName', symbol)
            price = meta.get('regularMarketPrice', 0)
            previous_close = meta.get('previousClose', 0)
            volume = meta.get('regularMarketVolume', 0)

            # Calculate change and percent
            if previous_close > 0:
                change = price - previous_close
                change_percent = (change / previous_close) * 100
            else:
                change = 0
                change_percent = 0

            # Determine if stock is up or down
            direction = '📈' if change >= 0 else '📉'

            # Format title
            title = f"{direction} {symbol} - {name}"

            # Format description with key metrics
            description = (
                f"${price:.2f} ({change:+.2f}, {change_percent:+.2f}%) "
                f"| Volume: {self._format_number(volume)}"
            )

            # Create URL to Yahoo Finance page
            url = f"https://finance.yahoo.com/quote/{symbol}"

            yield {
                'title': title,
                'url': url,
                'source': 'stocks',
                'description': description,
                'language': None,
                'stars': int(volume) if volume else 0,  # Use volume for sorting
                'author': self.category.replace('_', ' ').title(),
                'comments': None,
                'score': int(volume) if volume else 0,
                'reactions': None,
                'category': 'stock'
            }

        except Exception as e:
            self.logger.error(f"Error parsing quote: {e}")
            self.logger.error(f"Response text (first 500 chars): {response.text[:500]}")
            return

    def _format_number(self, num):
        """Format large numbers with K, M, B suffixes."""
        if not num or num == 0:
            return "N/A"

        num = float(num)
        if num >= 1_000_000_000_000:
            return f"{num / 1_000_000_000_000:.2f}T"
        elif num >= 1_000_000_000:
            return f"{num / 1_000_000_000:.2f}B"
        elif num >= 1_000_000:
            return f"{num / 1_000_000:.2f}M"
        elif num >= 1_000:
            return f"{num / 1_000:.2f}K"
        else:
            return f"{num:.0f}"
