"""
Stocks Source - Implements unified search interface for stock market data.

Maps keyword searches to ticker symbols and uses Yahoo Finance API for real-time data.
This is a simpler wrapper - no complex relevance scoring needed, just keyword matching.
"""

import requests
import asyncio
from typing import List, Optional
from api.services.source_registry import SearchSource, SearchResult, SourceType


class StocksSource(SearchSource):
    """Stock market search implementation using Yahoo Finance."""

    def __init__(self):
        """Initialize Yahoo Finance API client."""
        self.api_url = "https://query1.finance.yahoo.com"

        # Common ticker symbol mappings for keyword searches
        # This allows queries like "show me Tesla stock" to map to TSLA
        self.ticker_map = {
            # Tech Giants (FAANG+)
            'apple': 'AAPL',
            'microsoft': 'MSFT',
            'google': 'GOOGL',
            'alphabet': 'GOOGL',
            'amazon': 'AMZN',
            'meta': 'META',
            'facebook': 'META',
            'netflix': 'NFLX',
            'tesla': 'TSLA',
            'nvidia': 'NVDA',

            # Other Tech
            'amd': 'AMD',
            'intel': 'INTC',
            'qualcomm': 'QCOM',
            'oracle': 'ORCL',
            'salesforce': 'CRM',
            'adobe': 'ADBE',
            'cisco': 'CSCO',
            'ibm': 'IBM',
            'uber': 'UBER',
            'lyft': 'LYFT',
            'airbnb': 'ABNB',
            'doordash': 'DASH',
            'spotify': 'SPOT',
            'twitter': 'X',
            'x': 'X',
            'snap': 'SNAP',
            'snapchat': 'SNAP',
            'reddit': 'RDDT',
            'roblox': 'RBLX',

            # Finance
            'jpmorgan': 'JPM',
            'goldman': 'GS',
            'morgan stanley': 'MS',
            'bank of america': 'BAC',
            'wells fargo': 'WFC',
            'citigroup': 'C',
            'visa': 'V',
            'mastercard': 'MA',
            'paypal': 'PYPL',
            'square': 'SQ',
            'coinbase': 'COIN',

            # Retail
            'walmart': 'WMT',
            'target': 'TGT',
            'costco': 'COST',
            'home depot': 'HD',
            'lowes': 'LOW',
            'nike': 'NKE',
            'starbucks': 'SBUX',
            'mcdonalds': 'MCD',
            'chipotle': 'CMG',

            # Auto
            'ford': 'F',
            'gm': 'GM',
            'general motors': 'GM',
            'toyota': 'TM',
            'ferrari': 'RACE',
            'rivian': 'RIVN',
            'lucid': 'LCID',

            # Airlines
            'delta': 'DAL',
            'american airlines': 'AAL',
            'united': 'UAL',
            'southwest': 'LUV',

            # Pharma/Healthcare
            'pfizer': 'PFE',
            'moderna': 'MRNA',
            'johnson': 'JNJ',
            'abbvie': 'ABBV',
            'merck': 'MRK',
            'eli lilly': 'LLY',

            # Energy
            'exxon': 'XOM',
            'chevron': 'CVX',
            'conocophillips': 'COP',
            'schlumberger': 'SLB',

            # Misc
            'disney': 'DIS',
            'warner bros': 'WBD',
            'comcast': 'CMCSA',
            'verizon': 'VZ',
            'att': 'T',
            'tmobile': 'TMUS',
        }

    def get_name(self) -> str:
        return 'stocks'

    def get_display_name(self) -> str:
        return 'Stocks'

    def get_source_type(self) -> SourceType:
        return SourceType.MARKET

    def get_capabilities(self) -> dict:
        return {
            'filters': [],
            'supports_sort': False,
            'max_limit': 25,
        }

    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Search for stocks by keyword or ticker symbol.

        Simpler than other sources - just keyword matching to ticker symbols.

        Args:
            query: Search query (company name or ticker)
            limit: Max results

        Returns:
            List of SearchResult objects
        """
        # Extract ticker symbols from query
        tickers = self._extract_tickers(query)

        if not tickers:
            # No specific tickers found, return trending stocks
            print("📊 No specific ticker found, returning trending stocks")
            tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'][:limit]

        # Fetch stock data
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            tickers,
            limit
        )

        return results

    def _extract_tickers(self, query: str) -> List[str]:
        """
        Extract ticker symbols from query.

        Args:
            query: User's search query

        Returns:
            List of ticker symbols
        """
        query_lower = query.lower()
        tickers = []

        # Check for direct ticker symbols (all caps, 1-5 letters)
        words = query.split()
        for word in words:
            if word.isupper() and 1 <= len(word) <= 5 and word.isalpha():
                tickers.append(word)

        # Check keyword mappings
        for keyword, ticker in self.ticker_map.items():
            if keyword in query_lower:
                if ticker not in tickers:
                    tickers.append(ticker)

        return tickers

    def _sync_search(self, tickers: List[str], limit: int) -> List[SearchResult]:
        """
        Synchronous search helper (runs in thread pool).

        Fetches real-time stock data from Yahoo Finance API.
        """
        results = []

        try:
            # Fetch quotes for all tickers in one request
            symbols = ','.join(tickers[:limit])
            url = f"{self.api_url}/v6/finance/quote?symbols={symbols}"

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://finance.yahoo.com',
            }

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"❌ Yahoo Finance API error: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return []

            data = response.json()
            quotes = data.get('quoteResponse', {}).get('result', [])

            for quote in quotes:
                symbol = quote.get('symbol', '')
                name = quote.get('longName') or quote.get('shortName', symbol)
                price = quote.get('regularMarketPrice', 0)
                previous_close = quote.get('regularMarketPreviousClose', 0)
                volume = quote.get('regularMarketVolume', 0)

                # Calculate change and percent
                if previous_close > 0:
                    change = price - previous_close
                    change_percent = (change / previous_close) * 100
                else:
                    change = 0
                    change_percent = 0

                # Determine direction
                direction = '📈' if change >= 0 else '📉'

                # Format title and description
                title = f"{direction} {symbol} - {name}"
                description = (
                    f"${price:.2f} ({change:+.2f}, {change_percent:+.2f}%) "
                    f"| Volume: {self._format_number(volume)}"
                )

                result = SearchResult(
                    title=title,
                    url=f"https://finance.yahoo.com/quote/{symbol}",
                    source='synth/stocks',
                    result_type=SourceType.MARKET,
                    description=description,
                    author='Yahoo Finance',
                    score=int(volume) if volume else 0,  # Use volume as score
                    metadata={
                        'symbol': symbol,
                        'price': price,
                        'change': change,
                        'change_percent': change_percent,
                        'volume': volume,
                        'category': 'stock'
                    }
                )
                results.append(result)

            print(f"✅ Stocks: Found {len(results)} quotes")
            return results

        except Exception as e:
            print(f"❌ Stocks search error: {e}")
            return []

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
