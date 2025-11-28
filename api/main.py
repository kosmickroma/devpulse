"""
FastAPI backend for DevPulse interactive terminal.

Provides endpoints for running spiders and streaming results in real-time.
Includes SYNTH AI assistant powered by Google Gemini.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
import asyncio
import json
import os
from datetime import datetime
from api.spider_runner import SpiderRunner
from supabase import create_client, Client

# Import SYNTH AI routers
from api.ai import summarize, ask, search, demo

# Import Market data routers
from api.market import stocks, crypto

# Import Arcade routers
from api.arcade import scores, badges, profile, codequest

app = FastAPI(
    title="DevPulse API",
    description="Real-time developer trends aggregation with AI assistant",
    version="2.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://devpulse-1z8l.vercel.app",
        "https://devpulse-1z8l-git-main-kory-karps-projects.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global spider runner instance
spider_runner = SpiderRunner()

# Supabase client for backfill metadata
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("WARNING: Supabase not configured for backfill metadata")


@app.get("/")
async def root():
    return {
        "status": "online",
        "version": "1.1.0",
        "message": "DevPulse API - Track the pulse of developer trends"
    }


@app.get("/api/scan")
async def scan_stream(
    sources: Optional[str] = None,
    platform: Optional[str] = None,
    language: Optional[str] = None,
    time_range: str = "daily",
    demo: bool = False
):
    async def event_generator():
        source_param = sources or platform or "all"

        source_to_spider = {
            'github': 'github_api',
            'hackernews': 'hackernews',
            'devto': 'devto',
            'reddit': 'reddit_api',
            'stocks': 'yahoo_finance',
            'crypto': 'coingecko',
            'ign': 'ign',
            'pcgamer': 'pcgamer',
            'bbc': 'bbc',
            'deutschewelle': 'deutschewelle',
            'thehindu': 'thehindu',
            'africanews': 'africanews',
            'bangkokpost': 'bangkokpost',
            'rt': 'rt'
        }

        # Sources that use unified search interface (not Scrapy)
        unified_sources = {'ign', 'pcgamer', 'bbc', 'deutschewelle', 'thehindu', 'africanews', 'bangkokpost', 'rt'}

        if source_param == "all":
            spiders = list(source_to_spider.values())
        else:
            source_list = [s.strip() for s in source_param.split(',')]
            spiders = [source_to_spider.get(s, s) for s in source_list]

        # DEMO MODE: Send cached items INSTANTLY
        if demo:
            from api.services.demo_cache_service import DemoCacheService

            # PHASE 1: INSTANT CACHED BURST (360 items in <1s)
            cached_items = await DemoCacheService.get_cached_items_shuffled()

            if cached_items:
                for item in cached_items:
                    yield f"data: {json.dumps({'type': 'cached_item', 'data': item})}\n\n"
                    await asyncio.sleep(0.002)  # ~2ms per item = ~720ms total for 360 items

            # PHASE 2: TRANSITION MESSAGE
            yield f"data: {json.dumps({'type': 'status', 'message': '🔄 Fetching latest updates...'})}\n\n"
            await asyncio.sleep(0.1)

        # NORMAL MODE or continuing after cached burst in DEMO MODE
        yield f"data: {json.dumps({'type': 'status', 'message': f'Launching {len(spiders)} sources in true parallel...'})}\n\n"
        await asyncio.sleep(0.2)

        # Launch all spiders simultaneously (route to appropriate runner)
        generators = []
        for spider_name in spiders:
            if spider_name in unified_sources:
                # Use unified source runner for IGN, PC Gamer, BBC, DW, Hindu, etc.
                # Set appropriate query and limit per source
                if spider_name == 'bbc':
                    query = "news"
                    limit = 88
                elif spider_name == 'deutschewelle':
                    query = "news"
                    limit = 150  # DW has 100+ articles
                elif spider_name == 'thehindu':
                    query = "news"
                    limit = 120  # Hindu has ~100 articles
                elif spider_name == 'africanews':
                    query = "news"
                    limit = 50  # Single feed
                elif spider_name == 'bangkokpost':
                    query = "news"
                    limit = 200  # Multiple feeds aggregated
                elif spider_name == 'rt':
                    query = "news"
                    limit = 150  # Full feed (100+)
                else:
                    # Gaming sources (IGN, PC Gamer)
                    query = "gaming"
                    limit = 30

                generators.append(
                    spider_runner.run_unified_source_async(
                        source_name=spider_name,
                        query=query,
                        limit=limit
                    )
                )
            else:
                # Use Scrapy spider runner
                generators.append(
                    spider_runner.run_spider_async(
                        spider_name=spider_name,
                        language=language if spider_name == "github_api" else None,
                        time_range=time_range
                    )
                )

        queue = asyncio.Queue()
        total_items_counter = [0]
        completed = 0
        connected_sources = set()

        async def relay(spider_name, gen):
            nonlocal completed
            first_item = True
            try:
                async for event in gen:
                    if event.get('type') == 'item':
                        total_items_counter[0] += 1
                        event['data']['source_tag'] = spider_name.replace('_api', '').replace('yahoo_finance', 'stocks').replace('hackernews', 'hn').replace('coingecko', 'crypto')

                        if first_item:
                            source_display = spider_name.replace('_api', '').replace('yahoo_finance', 'stocks').replace('hackernews', 'hn').replace('coingecko', 'crypto')
                            await queue.put({'type': 'source_connected', 'source': source_display.title()})
                            first_item = False

                    await queue.put(event)
            except Exception as e:
                await queue.put({'type': 'error', 'spider': spider_name, 'message': str(e)})
            finally:
                await queue.put(None)

        # FIRE EVERYTHING AT ONCE
        for spider_name, gen in zip(spiders, generators):
            asyncio.create_task(relay(spider_name, gen))

        # Stream the firehose — no waiting, no mercy
        while completed < len(spiders) or not queue.empty():
            try:
                event = await asyncio.wait_for(queue.get(), timeout=0.15)
            except asyncio.TimeoutError:
                continue

            if event is None:
                completed += 1
                continue

            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.03)  # perfect retro feel

        yield f"data: {json.dumps({'type': 'scan_complete', 'total_items': total_items_counter[0]})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/api/spiders")
async def list_spiders():
    return {
        "spiders": [
            {"name": "github_api", "display": "GitHub", "supports_language": True, "supports_time_range": True},
            {"name": "hackernews", "display": "Hacker News", "supports_language": False, "supports_time_range": False},
            {"name": "devto", "display": "Dev.to", "supports_language": False, "supports_time_range": True},
            {"name": "reddit_api", "display": "Reddit", "supports_language": False, "supports_time_range": False},
            {"name": "yahoo_finance", "display": "Stocks", "supports_language": False, "supports_time_range": False},
            {"name": "coingecko", "display": "Crypto", "supports_language": False, "supports_time_range": False},
        ]
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "spiders_available": 6,
        "ai_enabled": True,
        "api_version": "2.0.0",
        "firehose_mode": "GOD MODE ACTIVATED"
    }


@app.get("/api/debug/env")
async def check_environment():
    import os
    env_vars = {
        "REDDIT_CLIENT_ID": "SET" if os.getenv('REDDIT_CLIENT_ID') else "MISSING",
        "REDDIT_CLIENT_SECRET": "SET" if os.getenv('REDDIT_CLIENT_SECRET') else "MISSING",
        "REDDIT_USERNAME": "SET" if os.getenv('REDDIT_USERNAME') else "MISSING",
        "REDDIT_PASSWORD": "SET" if os.getenv('REDDIT_PASSWORD') else "MISSING",
        "GITHUB_TOKEN": "SET" if os.getenv('GITHUB_TOKEN') else "MISSING",
    }
    set_count = sum(1 for v in env_vars.values() if v == "SET")
    return {
        "environment_variables": env_vars,
        "summary": f"{set_count}/{len(env_vars)} credentials configured",
        "reddit_ready": all(os.getenv(var) for var in ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USERNAME', 'REDDIT_PASSWORD'])
    }


# Include routers
app.include_router(summarize.router, prefix='/api/ai', tags=['synth-ai'])
app.include_router(ask.router, prefix='/api/ai', tags=['synth-ai'])
app.include_router(search.router, prefix='/api/ai', tags=['synth-ai'])
app.include_router(demo.router, prefix='/api/ai/demo', tags=['synth-demo'])
app.include_router(stocks.router, prefix='/api', tags=['market-data'])
app.include_router(crypto.router, prefix='/api', tags=['market-data'])
app.include_router(scores.router, prefix='/api/arcade', tags=['arcade'])
app.include_router(badges.router, prefix='/api/arcade/badges', tags=['badges'])
app.include_router(profile.router, prefix='/api/arcade/profile', tags=['profile'])
app.include_router(codequest.router, prefix='/api/arcade/codequest', tags=['code-quest'])

# Backfill endpoint
@app.post("/api/backfill")
async def backfill_trends():
    from api.services.demo_cache_service import DemoCacheService

    start_time = datetime.now()
    print(f"[{start_time}] Scheduled backfill started")

    # ALL 14 sources - Scrapy + Unified
    scrapy_sources = ['github_api', 'hackernews', 'devto', 'reddit_api', 'yahoo_finance', 'coingecko']
    unified_sources = ['ign', 'pcgamer', 'bbc', 'deutschewelle', 'thehindu', 'africanews', 'bangkokpost', 'rt']

    all_results = []
    errors = []
    source_results = {}  # Track results per source for caching

    try:
        # Run Scrapy sources
        for spider_name in scrapy_sources:
            try:
                print(f"[{datetime.now()}] Running {spider_name}...")
                source_items = []
                async for event in spider_runner.run_spider_async(spider_name):
                    if event['type'] == 'item':
                        all_results.append(event['data'])
                        source_items.append(event['data'])
                    elif event['type'] == 'error':
                        errors.append(f"{spider_name}: {event['message']}")

                # Store results for this source
                if source_items:
                    # Normalize source name (github_api -> github, etc.)
                    cache_source = spider_name.replace('_api', '').replace('yahoo_finance', 'stocks').replace('coingecko', 'crypto')
                    source_results[cache_source] = source_items
                    await DemoCacheService.store_scan_results(cache_source, source_items)

            except Exception as e:
                errors.append(f"{spider_name}: {str(e)}")
                print(f"[ERROR] {spider_name}: {str(e)}")

        # Run Unified sources with appropriate query and limits
        for source_name in unified_sources:
            try:
                # Set query and limit based on source type
                if source_name == 'bbc':
                    query = "news"
                    limit = 88
                elif source_name == 'deutschewelle':
                    query = "news"
                    limit = 150
                elif source_name == 'thehindu':
                    query = "news"
                    limit = 120
                elif source_name == 'africanews':
                    query = "news"
                    limit = 50
                elif source_name == 'bangkokpost':
                    query = "news"
                    limit = 200
                elif source_name == 'rt':
                    query = "news"
                    limit = 150
                else:
                    # Gaming sources (IGN, PC Gamer)
                    query = "gaming"
                    limit = 30

                print(f"[{datetime.now()}] Running {source_name} (unified)...")
                source_items = []
                async for event in spider_runner.run_unified_source_async(
                    source_name=source_name,
                    query=query,
                    limit=limit
                ):
                    if event['type'] == 'item':
                        all_results.append(event['data'])
                        source_items.append(event['data'])
                    elif event['type'] == 'error':
                        errors.append(f"{source_name}: {event['message']}")

                # Store results for this source
                if source_items:
                    source_results[source_name] = source_items
                    await DemoCacheService.store_scan_results(source_name, source_items)

            except Exception as e:
                errors.append(f"{source_name}: {str(e)}")
                print(f"[ERROR] {source_name}: {str(e)}")

        if supabase:
            try:
                all_sources = scrapy_sources + unified_sources
                metadata = {
                    'last_updated': start_time.isoformat(),
                    'total_trends': len(all_results),
                    'sources_included': all_sources,
                    'status': 'success' if not errors else 'partial',
                    'error_message': '; '.join(errors) if errors else None
                }
                supabase.table('backfill_metadata').insert(metadata).execute()
            except Exception as e:
                print(f"[ERROR] Failed to save metadata: {e}")

        duration = (datetime.now() - start_time).total_seconds()
        print(f"Backfill finished — {len(all_results)} trends in {duration:.2f}s")
        print(f"✅ Cached {len(source_results)} sources to database for instant loading")

        return {
            "status": "success" if not errors else "partial",
            "count": len(all_results),
            "duration_seconds": duration,
            "message": f"Backfill completed with {len(all_results)} trends"
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/backfill/status")
async def get_backfill_status():
    if not supabase:
        return {"error": "Supabase not configured", "last_updated": None, "total_trends": 0}
    try:
        result = supabase.table('backfill_metadata').select('*').order('last_updated', desc=True).limit(1).execute()
        if result.data:
            return result.data[0]
        return {"last_updated": None, "total_trends": 0, "message": "No backfill runs yet"}
    except Exception as e:
        return {"error": str(e)}


# ============================================
# DEMO MODE ENDPOINTS
# ============================================

@app.get("/api/demo/cached-items")
async def get_demo_cached_items():
    """
    Get cached items for instant demo mode display.
    Returns up to 360 items (60 per source) in randomized order.
    """
    from api.services.demo_cache_service import DemoCacheService

    items = await DemoCacheService.get_cached_items_shuffled()
    return {
        "success": True,
        "count": len(items),
        "items": items
    }


@app.get("/api/demo/synth-search")
async def get_demo_synth_search():
    """
    Get pre-cached Synth search result for demo mode.
    Returns instant results without calling Gemini API.
    """
    from api.services.demo_cache_service import SynthDemoCacheService

    result = await SynthDemoCacheService.get_demo_search_result()
    return result


@app.post("/api/demo/refresh-cache")
async def refresh_demo_cache():
    """
    Manually trigger cache refresh for all sources.
    Runs full scan and stores top 60 items per source.
    """
    from api.services.demo_cache_service import DemoCacheService
    import asyncio

    # Run refresh in background
    asyncio.create_task(DemoCacheService.refresh_all_sources())

    return {
        "success": True,
        "message": "Cache refresh started in background"
    }


@app.get("/api/demo/cache-stats")
async def get_cache_stats():
    """
    Get statistics about cached items.
    Shows count per source, last updated times, etc.
    """
    from api.services.demo_cache_service import DemoCacheService

    stats = await DemoCacheService.get_cache_stats()
    return stats


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")