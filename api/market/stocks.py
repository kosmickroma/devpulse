"""
Stock Market API - Dedicated endpoint for widget data

Provides real-time stock quotes independent of terminal scanning.
Includes server-side caching to minimize API calls.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
from datetime import datetime, timedelta
import os

router = APIRouter()

# Simple in-memory cache
_stock_cache = {}
_cache_duration = timedelta(seconds=60)  # Cache for 60 seconds


class StockQuote(BaseModel):
    """Stock quote response model."""
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float
    volume: Optional[int] = None
    marketCap: Optional[int] = None
    timestamp: str


class StockResponse(BaseModel):
    """API response for stock quotes."""
    stocks: List[StockQuote]
    cached: bool
    timestamp: str


def _get_cached_stock(symbol: str) -> Optional[StockQuote]:
    """Get stock from cache if fresh."""
    if symbol in _stock_cache:
        cached_data, cached_time = _stock_cache[symbol]
        if datetime.now() - cached_time < _cache_duration:
            return cached_data
    return None


def _cache_stock(symbol: str, data: StockQuote):
    """Cache stock data."""
    _stock_cache[symbol] = (data, datetime.now())


def _fetch_stock_quote(symbol: str) -> Optional[StockQuote]:
    """
    Fetch real-time stock quote from Yahoo Finance API.

    Uses the unofficial Yahoo Finance API (no key required).
    """
    try:
        # Yahoo Finance quote API
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {
            'interval': '1d',
            'range': '1d'
        }

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(url, params=params, headers=headers, timeout=5)

        if response.status_code != 200:
            print(f"❌ Failed to fetch {symbol}: HTTP {response.status_code}")
            return None

        data = response.json()

        # Parse Yahoo Finance response
        chart = data.get('chart', {})
        result = chart.get('result', [])

        if not result:
            print(f"❌ No data for {symbol}")
            return None

        quote_data = result[0]
        meta = quote_data.get('meta', {})

        # Get current price
        current_price = meta.get('regularMarketPrice', 0)
        previous_close = meta.get('previousClose', current_price)

        # Calculate change
        change = current_price - previous_close
        change_percent = (change / previous_close * 100) if previous_close != 0 else 0

        stock_quote = StockQuote(
            symbol=symbol.upper(),
            name=meta.get('longName', symbol),
            price=current_price,
            change=change,
            changePercent=change_percent,
            volume=meta.get('regularMarketVolume'),
            marketCap=meta.get('marketCap'),
            timestamp=datetime.now().isoformat()
        )

        # Cache it
        _cache_stock(symbol, stock_quote)

        print(f"✅ Fetched {symbol}: ${current_price:.2f}")
        return stock_quote

    except Exception as e:
        print(f"❌ Error fetching {symbol}: {e}")
        return None


@router.get('/stocks', response_model=StockResponse)
async def get_stock_quotes(symbols: str = "AAPL,MSFT,GOOGL"):
    """
    Get real-time stock quotes for specified symbols.

    Args:
        symbols: Comma-separated stock symbols (e.g., "AAPL,TSLA,NVDA")

    Returns:
        Stock quotes with caching metadata

    Example:
        GET /api/stocks?symbols=AAPL,TSLA,NVDA
    """
    # Parse symbols
    symbol_list = [s.strip().upper() for s in symbols.split(',') if s.strip()]

    if not symbol_list:
        raise HTTPException(status_code=400, detail="No symbols provided")

    if len(symbol_list) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 symbols allowed")

    stocks = []
    all_cached = True

    for symbol in symbol_list:
        # Check cache first
        cached = _get_cached_stock(symbol)
        if cached:
            stocks.append(cached)
        else:
            # Fetch fresh data
            quote = _fetch_stock_quote(symbol)
            if quote:
                stocks.append(quote)
                all_cached = False
            else:
                # Return placeholder for failed fetches
                stocks.append(StockQuote(
                    symbol=symbol,
                    name="Unknown",
                    price=0.0,
                    change=0.0,
                    changePercent=0.0,
                    timestamp=datetime.now().isoformat()
                ))

    return StockResponse(
        stocks=stocks,
        cached=all_cached,
        timestamp=datetime.now().isoformat()
    )


@router.get('/stocks/trending')
async def get_trending_stocks():
    """
    Get trending stocks (top gainers/losers).

    This is a lightweight endpoint that returns pre-defined trending symbols.
    """
    # Default trending symbols
    trending = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "AMD", "NFLX", "DIS"]

    return await get_stock_quotes(symbols=",".join(trending))
