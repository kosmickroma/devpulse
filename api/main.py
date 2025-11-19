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
from fastapi import BackgroundTasks
from datetime import datetime
from api.spider_runner import SpiderRunner
from supabase import create_client, Client

# Import SYNTH AI routers
from api.ai import summarize, ask, search

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
        "http://localhost:3000",  # Local dev
        "http://localhost:3001",  # Local dev alternate
        "https://devpulse-1z8l.vercel.app",  # Production
        "https://devpulse-1z8l-git-main-kory-karps-projects.vercel.app",  # Vercel preview
        "https://*.vercel.app",  # All Vercel deployments
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
    """Health check endpoint."""
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
    time_range: str = "daily"
):
    """
    Scan platforms and stream results in real-time using Server-Sent Events.

    Args:
        sources: Comma-separated list (github, hackernews, devto, reddit, stocks, crypto) or "all"
        platform: Legacy parameter (same as sources)
        language: Programming language filter (GitHub only)
        time_range: daily, weekly, or monthly

    Returns:
        StreamingResponse with Server-Sent Events
    """

    async def event_generator():
        """Generate SSE events as spider runs."""

        # Use sources parameter, fallback to platform for backwards compatibility
        source_param = sources or platform or "all"

        # Map source names to spider names
        source_to_spider = {
            'github': 'github_api',
            'hackernews': 'hackernews',
            'devto': 'devto',
            'reddit': 'reddit_api',
            'stocks': 'yahoo_finance',
            'crypto': 'coingecko'
        }

        # Determine which spiders to run
        if source_param == "all":
            spiders = ["github_api", "hackernews", "devto", "reddit_api", "yahoo_finance", "coingecko"]
        else:
            # Handle comma-separated list
            source_list = [s.strip() for s in source_param.split(',')]
            spiders = [source_to_spider.get(s, s) for s in source_list]

        # Send initial status
        yield f"data: {json.dumps({'type': 'status', 'message': f'Initializing scan for {len(spiders)} platform(s)...'})}\n\n"
        await asyncio.sleep(0.5)

        total_items = 0

        # Run each spider
        for spider_name in spiders:
            # Send spider start event
            yield f"data: {json.dumps({'type': 'spider_start', 'spider': spider_name})}\n\n"
            await asyncio.sleep(0.3)

            # Run spider and stream results
            async for event in spider_runner.run_spider_async(
                spider_name=spider_name,
                language=language if spider_name == "github_api" else None,
                time_range=time_range
            ):
                # Only count actual items, not status events
                if event.get('type') == 'item':
                    total_items += 1
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for visual effect

            # Send spider complete event
            yield f"data: {json.dumps({'type': 'spider_complete', 'spider': spider_name})}\n\n"
            await asyncio.sleep(0.3)

        # Send final completion event
        yield f"data: {json.dumps({'type': 'scan_complete', 'total_items': total_items})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/api/spiders")
async def list_spiders():
    """List available spiders."""
    return {
        "spiders": [
            {
                "name": "github_api",
                "display": "GitHub",
                "supports_language": True,
                "supports_time_range": True
            },
            {
                "name": "hackernews",
                "display": "Hacker News",
                "supports_language": False,
                "supports_time_range": False
            },
            {
                "name": "devto",
                "display": "Dev.to",
                "supports_language": False,
                "supports_time_range": True
            },
            {
                "name": "reddit_api",
                "display": "Reddit",
                "supports_language": False,
                "supports_time_range": False
            },
            {
                "name": "yahoo_finance",
                "display": "Stocks",
                "supports_language": False,
                "supports_time_range": False
            },
            {
                "name": "coingecko",
                "display": "Crypto",
                "supports_language": False,
                "supports_time_range": False
            }
        ]
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "spiders_available": 6,
        "ai_enabled": True,
        "api_version": "2.0.0"
    }


@app.get("/api/debug/env")
async def check_environment():
    """
    Debug endpoint: Check environment variable status (for troubleshooting).
    Returns which env vars are set without exposing actual values.
    """
    import os

    env_vars = {
        # Reddit credentials
        "REDDIT_CLIENT_ID": "SET" if os.getenv('REDDIT_CLIENT_ID') else "MISSING",
        "REDDIT_CLIENT_SECRET": "SET" if os.getenv('REDDIT_CLIENT_SECRET') else "MISSING",
        "REDDIT_USERNAME": "SET" if os.getenv('REDDIT_USERNAME') else "MISSING",
        "REDDIT_PASSWORD": "SET" if os.getenv('REDDIT_PASSWORD') else "MISSING",

        # Other potential env vars
        "GITHUB_TOKEN": "SET" if os.getenv('GITHUB_TOKEN') else "MISSING",
    }

    # Count how many are set
    set_count = sum(1 for v in env_vars.values() if v == "SET")
    total_count = len(env_vars)

    return {
        "environment_variables": env_vars,
        "summary": f"{set_count}/{total_count} credentials configured",
        "reddit_ready": all(
            os.getenv(var) for var in ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USERNAME', 'REDDIT_PASSWORD']
        )
    }


# Include SYNTH AI routers
app.include_router(summarize.router, prefix='/api/ai', tags=['synth-ai'])
app.include_router(ask.router, prefix='/api/ai', tags=['synth-ai'])
app.include_router(search.router, prefix='/api/ai', tags=['synth-ai'])

# Include Market data routers
app.include_router(stocks.router, prefix='/api', tags=['market-data'])
app.include_router(crypto.router, prefix='/api', tags=['market-data'])

# Include Arcade routers
app.include_router(scores.router, prefix='/api/arcade', tags=['arcade'])
app.include_router(badges.router, prefix='/api/arcade/badges', tags=['badges'])
app.include_router(profile.router, prefix='/api/arcade/profile', tags=['profile'])
app.include_router(codequest.router, prefix='/api/arcade/codequest', tags=['code-quest'])

# Backfill endpoint - runs all spiders and saves metadata to Supabase
@app.post("/api/backfill")
async def backfill_trends():
    """
    Run all spiders to refresh cached trends and save metadata to Supabase.
    This is called by the GitHub Actions cron job every 4 hours.
    """
    start_time = datetime.now()
    print(f"[{start_time}] Scheduled backfill started")

    # All sources to scan
    sources = ['github_api', 'hackernews', 'devto', 'reddit_api', 'yahoo_finance', 'coingecko']
    all_results = []
    errors = []

    try:
        # Run all spiders and collect results
        for spider_name in sources:
            try:
                print(f"[{datetime.now()}] Running {spider_name}...")
                async for event in spider_runner.run_spider_async(spider_name):
                    if event['type'] == 'item':
                        all_results.append(event['data'])
                    elif event['type'] == 'error':
                        errors.append(f"{spider_name}: {event['message']}")
            except Exception as e:
                error_msg = f"{spider_name}: {str(e)}"
                errors.append(error_msg)
                print(f"[ERROR] {error_msg}")

        # Save metadata to Supabase
        if supabase:
            try:
                metadata = {
                    'last_updated': start_time.isoformat(),
                    'total_trends': len(all_results),
                    'sources_included': sources,
                    'status': 'success' if not errors else 'partial',
                    'error_message': '; '.join(errors) if errors else None
                }

                result = supabase.table('backfill_metadata').insert(metadata).execute()
                print(f"[{datetime.now()}] Metadata saved to Supabase")
            except Exception as e:
                print(f"[ERROR] Failed to save metadata to Supabase: {e}")
        else:
            print("[WARNING] Supabase not configured, skipping metadata save")

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"[{end_time}] Backfill finished — {len(all_results)} trends collected in {duration:.2f}s")

        return {
            "status": "success" if not errors else "partial",
            "count": len(all_results),
            "sources": sources,
            "errors": errors if errors else None,
            "updated": start_time.isoformat(),
            "duration_seconds": duration,
            "message": f"Backfill completed with {len(all_results)} trends"
        }

    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Backfill failed: {error_msg}")

        # Save error to Supabase
        if supabase:
            try:
                supabase.table('backfill_metadata').insert({
                    'last_updated': start_time.isoformat(),
                    'total_trends': 0,
                    'sources_included': sources,
                    'status': 'failed',
                    'error_message': error_msg
                }).execute()
            except Exception as db_error:
                print(f"[ERROR] Failed to save error to Supabase: {db_error}")

        return {"status": "error", "message": error_msg}


@app.get("/api/backfill/status")
async def get_backfill_status():
    """
    Get the status and timestamp of the last backfill run.
    Returns when the sources were last updated and how many trends were found.
    """
    if not supabase:
        return {
            "error": "Supabase not configured",
            "last_updated": None,
            "total_trends": 0
        }

    try:
        # Get the most recent backfill metadata
        result = supabase.table('backfill_metadata') \
            .select('*') \
            .order('last_updated', desc=True) \
            .limit(1) \
            .execute()

        if result.data and len(result.data) > 0:
            latest = result.data[0]
            return {
                "last_updated": latest['last_updated'],
                "total_trends": latest['total_trends'],
                "sources_included": latest['sources_included'],
                "status": latest['status'],
                "error_message": latest.get('error_message')
            }
        else:
            return {
                "last_updated": None,
                "total_trends": 0,
                "message": "No backfill runs recorded yet"
            }

    except Exception as e:
        print(f"[ERROR] Failed to fetch backfill status: {e}")
        return {
            "error": str(e),
            "last_updated": None,
            "total_trends": 0
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
