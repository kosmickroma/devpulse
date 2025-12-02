# Local Scrape → Cache → Demo Strategy

## The Problem
- Playwright needs 500MB memory
- Your instance has 512MB total
- Can't run live for demos without upgrading

## The Solution
Run scraper ONCE locally → Upload to cache → Serve instantly for demos

## Step 1: Run Locally (One Time)

```bash
# On your local machine (has plenty of RAM):
cd /mnt/c/Users/carol/devpulse

# Install dependencies locally
pip install scrapy-playwright playwright
playwright install chromium

# Run the full scrape
scrapy crawl newegg_gpu -a page_limit=84 -o newegg_cache.jsonl

# Should get 4,200+ items in ~25 seconds
```

## Step 2: Upload to Supabase Cache

```python
# scripts/upload_newegg_cache.py
import json
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Read cached items
with open('newegg_cache.jsonl', 'r') as f:
    items = [json.loads(line) for line in f]

print(f"Uploading {len(items)} Newegg items to cache...")

# Store in cache table
supabase.table('demo_cache').insert({
    'source': 'newegg',
    'items': items,
    'count': len(items),
    'cached_at': 'now()'
}).execute()

print("✅ Cache uploaded!")
```

## Step 3: Serve from Cache in DevPulse

Modify `api/services/demo_cache_service.py`:

```python
async def get_newegg_cached():
    """Get pre-scraped Newegg results from cache."""
    result = supabase.table('demo_cache')\
        .select('items')\
        .eq('source', 'newegg')\
        .single()\
        .execute()

    return result.data['items'] if result.data else []
```

Modify spider_runner to serve from cache:

```python
# In spider_runner.py - newegg_gpu handler
if spider_name == "newegg_gpu":
    # Serve from cache instead of live scrape
    cached = await DemoCacheService.get_newegg_cached()
    for item in cached:
        yield {"type": "item", "data": item}
        await asyncio.sleep(0.002)  # Stream fast but not instant
    return
```

## Benefits

✅ **Zero memory usage** on production server
✅ **Instant response** (no 25 second wait)
✅ **Zero cost** (no upgraded instance needed)
✅ **Perfect for demos** (consistent results)
✅ **Update cache** anytime by re-running locally

## When to Update Cache

- Before demo videos
- Weekly for fresh data
- When Newegg has sales/new GPUs
- Takes 30 seconds on your local machine

## For Production (When You Have Users)

When you actually need LIVE scraping:

**Option A**: Reverse engineer Newegg API (no browser)
**Option B**: AWS Lambda ($0.0005 per scrape)
**Option C**: Upgrade to 1GB instance ($7/mo)

## For Now

Use cached data for demos. No one will know it's cached - it streams in real-time and shows current prices/availability from your last local scrape.

Update the cache before recording your demo video and you're golden!
