"""
FastAPI backend for DevPulse interactive terminal.

Provides endpoints for running spiders and streaming results in real-time.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
import asyncio
import json

from api.spider_runner import SpiderRunner

app = FastAPI(
    title="DevPulse API",
    description="Real-time developer trends aggregation",
    version="1.1.0"
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
    platform: str = "all",
    language: Optional[str] = None,
    time_range: str = "daily"
):
    """
    Scan platforms and stream results in real-time using Server-Sent Events.

    Args:
        platform: github_api, hackernews, devto, or all
        language: Programming language filter (GitHub only)
        time_range: daily, weekly, or monthly

    Returns:
        StreamingResponse with Server-Sent Events
    """

    async def event_generator():
        """Generate SSE events as spider runs."""

        # Determine which spiders to run
        if platform == "all":
            spiders = ["github_api", "hackernews", "devto"]
        else:
            spiders = [platform]

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
            }
        ]
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "spiders_available": 3,
        "api_version": "1.1.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
