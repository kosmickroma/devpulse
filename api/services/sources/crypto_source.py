"""
Crypto Source - Implements unified search interface for cryptocurrency data.

Maps keyword searches to crypto symbols and uses CoinGecko API for real-time data.
This is a simpler wrapper - no complex relevance scoring needed, just keyword matching.
"""

import requests
import asyncio
from typing import List, Optional
from api.services.source_registry import SearchSource, SearchResult, SourceType


class CryptoSource(SearchSource):
    """Cryptocurrency search implementation using CoinGecko."""

    def __init__(self):
        """Initialize CoinGecko API client."""
        self.api_url = "https://api.coingecko.com/api/v3"

        # Common crypto symbol/name mappings for keyword searches
        # This allows queries like "show me Bitcoin" to map to BTC
        self.crypto_map = {
            # Top cryptos
            'bitcoin': 'bitcoin',
            'btc': 'bitcoin',
            'ethereum': 'ethereum',
            'eth': 'ethereum',
            'tether': 'tether',
            'usdt': 'tether',
            'bnb': 'binancecoin',
            'binance': 'binancecoin',
            'solana': 'solana',
            'sol': 'solana',
            'xrp': 'ripple',
            'ripple': 'ripple',
            'usdc': 'usd-coin',
            'cardano': 'cardano',
            'ada': 'cardano',
            'dogecoin': 'dogecoin',
            'doge': 'dogecoin',
            'avalanche': 'avalanche-2',
            'avax': 'avalanche-2',
            'tron': 'tron',
            'trx': 'tron',
            'polkadot': 'polkadot',
            'dot': 'polkadot',
            'chainlink': 'chainlink',
            'link': 'chainlink',
            'polygon': 'matic-network',
            'matic': 'matic-network',
            'shiba': 'shiba-inu',
            'shib': 'shiba-inu',
            'litecoin': 'litecoin',
            'ltc': 'litecoin',
            'stellar': 'stellar',
            'xlm': 'stellar',
            'monero': 'monero',
            'xmr': 'monero',
            'cosmos': 'cosmos',
            'atom': 'cosmos',
            'algorand': 'algorand',
            'algo': 'algorand',
            'vechain': 'vechain',
            'vet': 'vechain',
            'filecoin': 'filecoin',
            'fil': 'filecoin',
            'hedera': 'hedera-hashgraph',
            'hbar': 'hedera-hashgraph',
            'internet computer': 'internet-computer',
            'icp': 'internet-computer',
            'aptos': 'aptos',
            'apt': 'aptos',
            'arbitrum': 'arbitrum',
            'arb': 'arbitrum',
            'optimism': 'optimism',
            'op': 'optimism',
            'near': 'near',
            'injective': 'injective-protocol',
            'inj': 'injective-protocol',
            'immutable': 'immutable-x',
            'imx': 'immutable-x',
            'cronos': 'crypto-com-chain',
            'cro': 'crypto-com-chain',
        }

    def get_name(self) -> str:
        return 'crypto'

    def get_display_name(self) -> str:
        return 'Crypto'

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
        Search for cryptocurrencies by keyword or symbol.

        Simpler than other sources - just keyword matching to crypto IDs.

        Args:
            query: Search query (crypto name or symbol)
            limit: Max results

        Returns:
            List of SearchResult objects
        """
        # Extract crypto IDs from query
        crypto_ids = self._extract_crypto_ids(query)

        if not crypto_ids:
            # No specific cryptos found, return trending
            print("📊 No specific crypto found, returning trending")
            return await self._get_trending(limit)

        # Fetch crypto data
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self._sync_search,
            crypto_ids,
            limit
        )

        return results

    def _extract_crypto_ids(self, query: str) -> List[str]:
        """
        Extract crypto IDs from query.

        Args:
            query: User's search query

        Returns:
            List of CoinGecko crypto IDs
        """
        query_lower = query.lower()
        crypto_ids = []

        # Check keyword mappings
        for keyword, crypto_id in self.crypto_map.items():
            if keyword in query_lower:
                if crypto_id not in crypto_ids:
                    crypto_ids.append(crypto_id)

        return crypto_ids

    async def _get_trending(self, limit: int) -> List[SearchResult]:
        """Get trending cryptocurrencies."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_trending, limit)

    def _sync_trending(self, limit: int) -> List[SearchResult]:
        """Fetch trending cryptocurrencies (runs in thread pool)."""
        try:
            url = f"{self.api_url}/search/trending"
            headers = {'User-Agent': 'DevPulse/1.0'}

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"❌ CoinGecko API error: {response.status_code}")
                return []

            data = response.json()
            coins = data.get('coins', [])

            results = []
            for item in coins[:limit]:
                coin = item.get('item', {})
                symbol = coin.get('symbol', '').upper()
                name = coin.get('name', '')
                coin_id = coin.get('id', '')
                market_cap_rank = coin.get('market_cap_rank', 0)

                # Get price data from nested object
                coin_data = coin.get('data', {})
                price_usd = coin_data.get('price', 0)
                price_change_24h = coin_data.get('price_change_percentage_24h', {}).get('usd', 0)

                # Determine direction
                direction = '📈' if price_change_24h >= 0 else '📉'

                # Format title and description
                title = f"{direction} {symbol} - {name}"
                description = (
                    f"${price_usd:.6f} ({price_change_24h:+.2f}%) "
                    f"| Rank: #{market_cap_rank}" if market_cap_rank else f"${price_usd:.6f} ({price_change_24h:+.2f}%)"
                )

                result = SearchResult(
                    title=title,
                    url=f"https://www.coingecko.com/en/coins/{coin_id}",
                    source='synth/crypto',
                    result_type=SourceType.MARKET,
                    description=description,
                    author='CoinGecko',
                    score=market_cap_rank if market_cap_rank else 999,  # Lower rank = higher score
                    metadata={
                        'symbol': symbol,
                        'coin_id': coin_id,
                        'price': price_usd,
                        'change_24h': price_change_24h,
                        'market_cap_rank': market_cap_rank,
                        'category': 'crypto'
                    }
                )
                results.append(result)

            print(f"✅ Crypto: Found {len(results)} trending coins")
            return results

        except Exception as e:
            print(f"❌ Crypto trending search error: {e}")
            return []

    def _sync_search(self, crypto_ids: List[str], limit: int) -> List[SearchResult]:
        """
        Synchronous search helper (runs in thread pool).

        Fetches real-time crypto data from CoinGecko API.
        """
        results = []

        try:
            # Fetch market data for specific coins
            ids = ','.join(crypto_ids[:limit])
            url = (
                f"{self.api_url}/coins/markets"
                f"?vs_currency=usd"
                f"&ids={ids}"
                f"&order=market_cap_desc"
                f"&sparkline=false"
                f"&price_change_percentage=24h"
            )

            headers = {'User-Agent': 'DevPulse/1.0'}

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"❌ CoinGecko API error: {response.status_code}")
                return []

            coins = response.json()

            for coin in coins:
                symbol = coin.get('symbol', '').upper()
                name = coin.get('name', '')
                coin_id = coin.get('id', '')
                price = coin.get('current_price', 0)
                price_change_24h = coin.get('price_change_percentage_24h', 0)
                market_cap = coin.get('market_cap', 0)
                volume_24h = coin.get('total_volume', 0)
                market_cap_rank = coin.get('market_cap_rank', 0)

                # Determine direction
                direction = '📈' if price_change_24h >= 0 else '📉'

                # Format title and description
                title = f"{direction} {symbol} - {name}"
                price_formatted = f"${price:.6f}" if price < 1 else f"${price:.2f}"
                description = (
                    f"{price_formatted} ({price_change_24h:+.2f}%) "
                    f"| Market Cap: {self._format_number(market_cap)} "
                    f"| Volume: {self._format_number(volume_24h)}"
                )

                result = SearchResult(
                    title=title,
                    url=f"https://www.coingecko.com/en/coins/{coin_id}",
                    source='synth/crypto',
                    result_type=SourceType.MARKET,
                    description=description,
                    author='CoinGecko',
                    score=int(market_cap) if market_cap else 0,  # Use market cap as score
                    metadata={
                        'symbol': symbol,
                        'coin_id': coin_id,
                        'price': price,
                        'change_24h': price_change_24h,
                        'market_cap': market_cap,
                        'volume_24h': volume_24h,
                        'market_cap_rank': market_cap_rank,
                        'category': 'crypto'
                    }
                )
                results.append(result)

            # Sort by market cap (descending)
            results.sort(key=lambda x: x.score, reverse=True)

            print(f"✅ Crypto: Found {len(results)} coins")
            return results

        except Exception as e:
            print(f"❌ Crypto search error: {e}")
            return []

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
            return f"${num:.0f}"
