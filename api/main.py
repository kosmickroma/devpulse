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

from api.spider_runner import SpiderRunner

# Import SYNTH AI routers
from api.ai import summarize, ask, search

# Import Market data routers
from api.market import stocks, crypto

# Import Arcade routers
from api.arcade import scores

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
