# Local Testing Guide - Finance Spiders

## Current Issue
Stocks and crypto widgets show "Found 0 items" - the spiders may have bugs we haven't caught.

## Setup Local Environment

### 1. Install Python Dependencies
```bash
cd /mnt/c/Users/carol/devpulse
pip install -r requirements.txt
```

Or if using virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Test Yahoo Finance Spider

Test trending stocks:
```bash
scrapy crawl yahoo_finance -a category=trending -L INFO
```

Test gainers:
```bash
scrapy crawl yahoo_finance -a category=gainers -L INFO
```

Test with output to see actual data:
```bash
scrapy crawl yahoo_finance -a category=trending -o test_stocks.json
cat test_stocks.json
```

### 3. Test CoinGecko Spider

Test trending crypto:
```bash
scrapy crawl coingecko -a category=trending -L INFO
```

Test with output:
```bash
scrapy crawl coingecko -a category=trending -o test_crypto.json
cat test_crypto.json
```

## What To Check

### Expected Output Format
Each spider should yield items like:
```json
{
  "title": "📈 AAPL - Apple Inc.",
  "url": "https://finance.yahoo.com/quote/AAPL",
  "source": "stocks",
  "description": "$175.23 (+2.34, +1.35%) | Volume: 45.2M | Market Cap: 2.7T",
  "stars": 2700000000000,
  "author": "Trending",
  "category": "stock"
}
```

### Common Issues to Check

1. **API Response Changed**: Yahoo/CoinGecko may have changed their API format
2. **Rate Limiting**: APIs may be blocking requests
3. **JSON Parsing**: The `data.get()` chain may be wrong
4. **Empty Results**: API returns 200 but empty data

## Debugging Steps

### 1. Check if API returns data
```bash
# Test Yahoo Finance API directly
curl "https://query1.finance.yahoo.com/v1/finance/trending/US?count=25"

# Test CoinGecko API directly
curl "https://api.coingecko.com/api/v3/search/trending"
```

### 2. Add debug logging to spiders
In `yahoo_finance_spider.py` line 66, add:
```python
self.logger.info(f"API Response: {response.text[:500]}")  # First 500 chars
```

### 3. Check for errors
Run with verbose logging:
```bash
scrapy crawl yahoo_finance -a category=trending -L DEBUG 2>&1 | grep -i error
```

## Files to Check

### Backend Files
- `devpulse/spiders/yahoo_finance_spider.py` - Stock spider
- `devpulse/spiders/coingecko_spider.py` - Crypto spider
- `api/spider_runner.py` - Spider executor
- `api/main.py` - API endpoints

### Frontend Files
- `frontend/components/widgets/StockTickerWidget.tsx` - Stock widget
- `frontend/components/widgets/CryptoTickerWidget.tsx` - Crypto widget

## Known Issues Fixed
1. ✅ Backend API now recognizes stocks/crypto sources
2. ✅ Regex fixed in widget parsers: `/[📈📉]\s*([A-Z]+)/`
3. ✅ Boot sequence shows all 5 sources
4. ✅ Extra scan-line removed

## Still To Verify
- [ ] Do the spiders actually fetch data from APIs?
- [ ] Is the data format correct?
- [ ] Are there any exceptions being swallowed?

## Next Steps
1. Install dependencies locally
2. Test spiders individually with output files
3. Check if APIs return data
4. Fix any bugs found
5. Test via backend API endpoint
6. Then deploy
