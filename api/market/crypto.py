"""
Crypto Market API - Dedicated endpoint for widget data

Provides real-time crypto prices independent of terminal scanning.
Includes server-side caching to minimize API calls.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
from datetime import datetime, timedelta

router = APIRouter()

# Simple in-memory cache
_crypto_cache = {}
_cache_duration = timedelta(seconds=60)  # Cache for 60 seconds


class CryptoQuote(BaseModel):
    """Crypto quote response model."""
    symbol: str
    name: str
    price: float
    change24h: float
    changePercent24h: float
    marketCap: int
    volume24h: Optional[int] = None
    rank: Optional[int] = None
    timestamp: str


class CryptoResponse(BaseModel):
    """API response for crypto quotes."""
    coins: List[CryptoQuote]
    cached: bool
    timestamp: str


def _get_cached_crypto(coin_id: str) -> Optional[CryptoQuote]:
    """Get crypto from cache if fresh."""
    if coin_id in _crypto_cache:
        cached_data, cached_time = _crypto_cache[coin_id]
        if datetime.now() - cached_time < _cache_duration:
            return cached_data
    return None


def _cache_crypto(coin_id: str, data: CryptoQuote):
    """Cache crypto data."""
    _crypto_cache[coin_id] = (data, datetime.now())


def _fetch_crypto_quote(coin_id: str) -> Optional[CryptoQuote]:
    """
    Fetch real-time crypto quote from CoinGecko API.

    CoinGecko free tier: 10-50 calls/minute
    """
    try:
        # CoinGecko API (no key required for basic endpoints)
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        params = {
            'localization': 'false',
            'tickers': 'false',
            'market_data': 'true',
            'community_data': 'false',
            'developer_data': 'false',
            'sparkline': 'false'
        }

        headers = {
            'Accept': 'application/json'
        }

        response = requests.get(url, params=params, headers=headers, timeout=5)

        if response.status_code != 200:
            print(f"❌ Failed to fetch {coin_id}: HTTP {response.status_code}")
            return None

        data = response.json()
        market_data = data.get('market_data', {})

        # Get USD market data
        current_price = market_data.get('current_price', {}).get('usd', 0)
        price_change_24h = market_data.get('price_change_24h', 0)
        price_change_percentage_24h = market_data.get('price_change_percentage_24h', 0)
        market_cap = market_data.get('market_cap', {}).get('usd', 0)
        total_volume = market_data.get('total_volume', {}).get('usd', 0)
        market_cap_rank = market_data.get('market_cap_rank')

        crypto_quote = CryptoQuote(
            symbol=data.get('symbol', coin_id).upper(),
            name=data.get('name', coin_id),
            price=current_price,
            change24h=price_change_24h,
            changePercent24h=price_change_percentage_24h,
            marketCap=int(market_cap),
            volume24h=int(total_volume),
            rank=market_cap_rank,
            timestamp=datetime.now().isoformat()
        )

        # Cache it
        _cache_crypto(coin_id, crypto_quote)

        print(f"✅ Fetched {coin_id}: ${current_price:.2f}")
        return crypto_quote

    except Exception as e:
        print(f"❌ Error fetching {coin_id}: {e}")
        return None


@router.get('/crypto', response_model=CryptoResponse)
async def get_crypto_quotes(coins: str = "bitcoin,ethereum,solana"):
    """
    Get real-time crypto quotes for specified coins.

    Args:
        coins: Comma-separated coin IDs (e.g., "bitcoin,ethereum,cardano")
               Use CoinGecko coin IDs (lowercase, e.g., "bitcoin" not "BTC")

    Returns:
        Crypto quotes with caching metadata

    Example:
        GET /api/crypto?coins=bitcoin,ethereum,solana
    """
    # Parse coin IDs
    coin_list = [c.strip().lower() for c in coins.split(',') if c.strip()]

    if not coin_list:
        raise HTTPException(status_code=400, detail="No coins provided")

    if len(coin_list) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 coins allowed")

    cryptos = []
    all_cached = True

    for coin_id in coin_list:
        # Check cache first
        cached = _get_cached_crypto(coin_id)
        if cached:
            cryptos.append(cached)
        else:
            # Fetch fresh data
            quote = _fetch_crypto_quote(coin_id)
            if quote:
                cryptos.append(quote)
                all_cached = False
            else:
                # Return placeholder for failed fetches
                cryptos.append(CryptoQuote(
                    symbol=coin_id.upper(),
                    name="Unknown",
                    price=0.0,
                    change24h=0.0,
                    changePercent24h=0.0,
                    marketCap=0,
                    timestamp=datetime.now().isoformat()
                ))

    return CryptoResponse(
        coins=cryptos,
        cached=all_cached,
        timestamp=datetime.now().isoformat()
    )


@router.get('/crypto/trending')
async def get_trending_crypto():
    """
    Get trending cryptocurrencies (top by market cap).

    This is a lightweight endpoint that returns pre-defined trending coins.
    """
    # Default trending coins (by market cap)
    trending = ["bitcoin", "ethereum", "tether", "binancecoin", "solana",
                "ripple", "cardano", "dogecoin", "polkadot", "matic-network"]

    return await get_crypto_quotes(coins=",".join(trending))
