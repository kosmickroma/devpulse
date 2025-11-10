"""
CoinGecko spider for fetching trending cryptocurrencies.

Uses CoinGecko API to get:
- Trending coins
- Top coins by market cap
- Top gainers/losers
"""

import json
from typing import Generator

import scrapy
from scrapy.http import Response


class CoinGeckoSpider(scrapy.Spider):
    """
    Spider for fetching trending cryptocurrencies from CoinGecko.

    No API key required for basic endpoints.
    Rate limit: 50 calls/minute on free tier.
    """

    name = "coingecko"
    allowed_domains = ["api.coingecko.com"]

    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1.5,  # Respect rate limits
    }

    def __init__(self, category: str = "trending", *args, **kwargs):
        """
        Initialize the spider.

        Args:
            category: trending, top, gainers, or losers
        """
        super().__init__(*args, **kwargs)
        self.category = category

        # API endpoints
        if category == 'trending':
            self.start_urls = ['https://api.coingecko.com/api/v3/search/trending']
        else:
            # Top coins by market cap with 24h change
            self.start_urls = [
                'https://api.coingecko.com/api/v3/coins/markets'
                '?vs_currency=usd'
                '&order=market_cap_desc'
                '&per_page=50'
                '&page=1'
                '&sparkline=false'
                '&price_change_percentage=24h'
            ]

    def start_requests(self):
        """Generate initial requests."""
        headers = {
            'User-Agent': 'DevPulse/1.0',
        }

        for url in self.start_urls:
            yield scrapy.Request(url, headers=headers, callback=self.parse)

    def parse(self, response: Response) -> Generator:
        """Parse CoinGecko API response."""
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON: {e}")
            self.logger.error(f"Response status: {response.status}")
            self.logger.error(f"Response text (first 500 chars): {response.text[:500]}")
            return

        # Handle trending endpoint
        if self.category == 'trending':
            coins = data.get('coins', [])
            self.logger.info(f"Found {len(coins)} trending coins")

            for item in coins:
                coin = item.get('item', {})
                try:
                    symbol = coin.get('symbol', '').upper()
                    name = coin.get('name', '')
                    market_cap_rank = coin.get('market_cap_rank', 0)
                    coin_id = coin.get('id', '')

                    # Get USD price and change from nested data object
                    coin_data = coin.get('data', {})
                    price_usd = coin_data.get('price', 0)
                    price_change_24h = coin_data.get('price_change_percentage_24h', {}).get('usd', 0)

                    # Determine direction
                    direction = '📈' if price_change_24h >= 0 else '📉'

                    # Format title
                    title = f"{direction} {symbol} - {name}"

                    # Format description
                    description = (
                        f"${self._format_price(price_usd)} ({price_change_24h:+.2f}% 24h) "
                        f"| Rank: #{market_cap_rank}"
                    )

                    # Create URL
                    url = f"https://www.coingecko.com/en/coins/{coin_id}"

                    yield {
                        'title': title,
                        'url': url,
                        'source': 'crypto',
                        'description': description,
                        'language': None,
                        'stars': 10000 - market_cap_rank if market_cap_rank else 0,  # Higher rank = more "stars"
                        'author': 'Trending',
                        'comments': None,
                        'score': None,
                        'reactions': None,
                        'category': 'cryptocurrency'
                    }

                except Exception as e:
                    self.logger.error(f"Error parsing trending coin: {e}")
                    self.logger.error(f"Coin data: {coin}")
                    continue

        # Handle top/gainers/losers endpoint
        else:
            coins = data if isinstance(data, list) else []
            self.logger.info(f"Found {len(coins)} coins")

            # Filter based on category
            if self.category == 'gainers':
                coins = [c for c in coins if c.get('price_change_percentage_24h', 0) > 0]
                coins = sorted(coins, key=lambda x: x.get('price_change_percentage_24h', 0), reverse=True)[:25]
            elif self.category == 'losers':
                coins = [c for c in coins if c.get('price_change_percentage_24h', 0) < 0]
                coins = sorted(coins, key=lambda x: x.get('price_change_percentage_24h', 0))[:25]
            else:
                # Top by market cap
                coins = coins[:25]

            for coin in coins:
                try:
                    symbol = coin.get('symbol', '').upper()
                    name = coin.get('name', '')
                    current_price = coin.get('current_price', 0)
                    price_change_24h = coin.get('price_change_percentage_24h', 0)
                    market_cap = coin.get('market_cap', 0)
                    market_cap_rank = coin.get('market_cap_rank', 0)
                    volume_24h = coin.get('total_volume', 0)
                    coin_id = coin.get('id', '')

                    # Determine direction
                    direction = '📈' if price_change_24h >= 0 else '📉'

                    # Format title
                    title = f"{direction} {symbol} - {name}"

                    # Format description
                    description = (
                        f"${self._format_price(current_price)} ({price_change_24h:+.2f}% 24h) "
                        f"| Rank: #{market_cap_rank} "
                        f"| MCap: {self._format_number(market_cap)} "
                        f"| Vol: {self._format_number(volume_24h)}"
                    )

                    # Create URL
                    url = f"https://www.coingecko.com/en/coins/{coin_id}"

                    yield {
                        'title': title,
                        'url': url,
                        'source': 'crypto',
                        'description': description,
                        'language': None,
                        'stars': int(market_cap) if market_cap else 0,
                        'author': self.category.title(),
                        'comments': None,
                        'score': int(volume_24h) if volume_24h else 0,
                        'reactions': None,
                        'category': 'cryptocurrency'
                    }

                except Exception as e:
                    self.logger.error(f"Error parsing coin: {e}")
                    continue

    def _format_number(self, num):
        """Format large numbers with K, M, B, T suffixes."""
        if not num or num == 0:
            return "N/A"

        num = float(num)
        if num >= 1_000_000_000_000:
            return f"${num / 1_000_000_000_000:.2f}T"
        elif num >= 1_000_000_000:
            return f"${num / 1_000_000_000:.2f}B"
        elif num >= 1_000_000:
            return f"${num / 1_000_000:.2f}M"
        elif num >= 1_000:
            return f"${num / 1_000:.2f}K"
        else:
            return f"${num:.2f}"

    def _format_price(self, price):
        """Format price appropriately based on value."""
        if not price or price == 0:
            return "N/A"

        price = float(price)
        if price >= 1:
            return f"{price:,.2f}"
        elif price >= 0.01:
            return f"{price:.4f}"
        else:
            return f"{price:.8f}"
