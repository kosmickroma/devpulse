# DevPulse API

FastAPI backend for the DevPulse interactive terminal.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the API server:
```bash
# From project root
python -m uvicorn api.main:app --reload

# Or directly
cd api
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Endpoints

### GET `/`
Health check endpoint.

### GET `/api/scan`
Stream spider results in real-time using Server-Sent Events (SSE).

**Query Parameters:**
- `platform` (optional): `all`, `github_api`, `hackernews`, or `devto` (default: `all`)
- `language` (optional): Programming language filter for GitHub (e.g., `python`, `javascript`)
- `time_range` (optional): `daily`, `weekly`, or `monthly` (default: `daily`)

**Example:**
```bash
curl "http://localhost:8000/api/scan?platform=github_api&language=python"
```

### GET `/api/spiders`
List available spiders and their capabilities.

### GET `/api/health`
Detailed health check with spider availability.

## Development

The API uses:
- **FastAPI** for web framework
- **Scrapy** for running spiders
- **Server-Sent Events (SSE)** for real-time streaming
- **asyncio** for async execution

## Architecture

```
api/
├── main.py           # FastAPI app with endpoints
├── spider_runner.py  # Executes Scrapy spiders asynchronously
└── README.md         # This file
```

## CORS

The API allows requests from:
- `http://localhost:3000` (Next.js dev)
- `http://localhost:3001` (Alternative port)

## Notes

- The API must be running for the interactive terminal to work
- Make sure Scrapy spiders are working before using the API
- SSE connections are long-lived - they stream data as spiders run
