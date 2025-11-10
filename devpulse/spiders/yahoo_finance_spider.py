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
        'DOWNLOAD_DELAY': 0.5,
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }

        for url in self.start_urls:
            yield scrapy.Request(url, headers=headers, callback=self.parse)

    def parse(self, response: Response) -> Generator:
        """Parse Yahoo Finance API response."""
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON: {e}")
            return

        # Handle trending endpoint (different structure)
        if self.category == 'trending':
            quotes = data.get('finance', {}).get('result', [{}])[0].get('quotes', [])
        else:
            # Handle screener endpoints
            quotes = data.get('finance', {}).get('result', [{}])[0].get('quotes', [])

        self.logger.info(f"Found {len(quotes)} stocks in category: {self.category}")

        for quote in quotes:
            try:
                symbol = quote.get('symbol', '')
                name = quote.get('longName') or quote.get('shortName', symbol)
                price = quote.get('regularMarketPrice', 0)
                change = quote.get('regularMarketChange', 0)
                change_percent = quote.get('regularMarketChangePercent', 0)
                volume = quote.get('regularMarketVolume', 0)
                market_cap = quote.get('marketCap', 0)

                # Determine if stock is up or down
                direction = '📈' if change >= 0 else '📉'

                # Format title
                title = f"{direction} {symbol} - {name}"

                # Format description with key metrics
                description = (
                    f"${price:.2f} ({change:+.2f}, {change_percent:+.2f}%) "
                    f"| Volume: {self._format_number(volume)} "
                    f"| Market Cap: {self._format_number(market_cap)}"
                )

                # Create URL to Yahoo Finance page
                url = f"https://finance.yahoo.com/quote/{symbol}"

                yield {
                    'title': title,
                    'url': url,
                    'source': 'stocks',
                    'description': description,
                    'language': None,
                    'stars': int(market_cap) if market_cap else 0,  # Use market cap as "stars" for sorting
                    'author': self.category.replace('_', ' ').title(),
                    'comments': None,
                    'score': int(volume) if volume else 0,
                    'reactions': None,
                    'category': 'stock'
                }

            except Exception as e:
                self.logger.error(f"Error parsing stock: {e}")
                self.logger.error(f"Stock data: {quote}")
                continue

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
