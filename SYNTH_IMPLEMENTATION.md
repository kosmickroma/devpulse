# SYNTH AI Implementation Plan

**Status:** Ready to build
**Target:** Ship by end of weekend for testing
**Tokens Remaining:** ~135k (should be enough to complete)

---

## Overview

SYNTH is DevPulse's AI assistant powered by Google Gemini (free tier). It provides:
- 🤖 Article summaries on trend cards
- 💬 Terminal Q&A (`ask` command)
- 📚 Concept explanations (`explain` command)

**Personality:** 80s retro, chill, helpful. Signs with "SYNTH OUT 🌆"

---

## Rate Limits & Access

- **Requires login:** All AI features need authentication
- **Free users:** 50 queries/day (generous, will monitor and adjust)
- **Global cap:** 1,200 queries/day across all users
- **No paid tier yet:** Will add when we hit 100+ active users
- **Tracking:** Log user_id, timestamp, query_type, tokens_used (NOT query content)

---

## Architecture

### Backend Structure
```
backend/
├── api/
│   └── ai/
│       ├── summarize.py      # POST /api/ai/summarize
│       ├── ask.py             # POST /api/ai/ask
│       └── explain.py         # POST /api/ai/explain
├── services/
│   ├── gemini_service.py     # Wrapper for Gemini API
│   ├── rate_limit_service.py # Check limits before AI call
│   └── usage_tracker.py      # Log usage to database
├── models/
│   ├── ai_cache.py           # Summary cache model
│   └── ai_usage.py           # Usage tracking model
└── middleware/
    └── auth_required.py      # Protect endpoints
```

### Database Schema (Supabase)

**Table: ai_summaries**
```sql
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_url TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL  -- created_at + 7 days
);

CREATE INDEX idx_ai_summaries_url ON ai_summaries(article_url);
CREATE INDEX idx_ai_summaries_expires ON ai_summaries(expires_at);
```

**Table: ai_usage**
```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  query_type TEXT NOT NULL,  -- 'summary', 'ask', 'explain'
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at);
```

**View: daily_usage (for rate limiting)**
```sql
CREATE VIEW daily_ai_usage AS
SELECT
  user_id,
  DATE(created_at) as date,
  COUNT(*) as query_count
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id, DATE(created_at);
```

---

## Implementation Steps

### Phase 1: Backend Setup

**1.1 Install Dependencies**
```bash
cd backend
pip install google-generativeai
pip freeze > requirements.txt
```

**1.2 Get Gemini API Key**
- Go to https://aistudio.google.com/app/apikey
- Create new API key
- Add to backend/.env: `GEMINI_API_KEY=your_key_here`

**1.3 Create Gemini Service** (`backend/services/gemini_service.py`)
```python
import google.generativeai as genai
import os

class GeminiService:
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def generate(self, prompt: str, max_tokens: int = 150) -> str:
        """Generate response from Gemini"""
        response = self.model.generate_content(
            prompt,
            generation_config={'max_output_tokens': max_tokens}
        )
        return response.text
```

**1.4 Create Rate Limit Service** (`backend/services/rate_limit_service.py`)
```python
from supabase import create_client
import os
from datetime import datetime, timedelta

class RateLimitService:
    def __init__(self):
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        self.daily_limit = 50  # per user
        self.global_limit = 1200  # total across all users

    def check_user_limit(self, user_id: str) -> dict:
        """Check if user has queries remaining today"""
        # Query ai_usage for last 24 hours
        since = (datetime.now() - timedelta(days=1)).isoformat()

        result = self.supabase.table('ai_usage')\
            .select('*')\
            .eq('user_id', user_id)\
            .gte('created_at', since)\
            .execute()

        count = len(result.data)
        remaining = max(0, self.daily_limit - count)

        return {
            'allowed': remaining > 0,
            'remaining': remaining,
            'limit': self.daily_limit
        }

    def check_global_limit(self) -> bool:
        """Check if global daily limit exceeded"""
        since = (datetime.now() - timedelta(days=1)).isoformat()

        result = self.supabase.table('ai_usage')\
            .select('id')\
            .gte('created_at', since)\
            .execute()

        return len(result.data) < self.global_limit
```

**1.5 Create Usage Tracker** (`backend/services/usage_tracker.py`)
```python
from supabase import create_client
import os

class UsageTracker:
    def __init__(self):
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )

    def log_usage(self, user_id: str, query_type: str, tokens_used: int = 0):
        """Log AI usage to database"""
        self.supabase.table('ai_usage').insert({
            'user_id': user_id,
            'query_type': query_type,
            'tokens_used': tokens_used
        }).execute()
```

**1.6 Create Summarize Endpoint** (`backend/api/ai/summarize.py`)
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.gemini_service import GeminiService
from services.rate_limit_service import RateLimitService
from services.usage_tracker import UsageTracker
from middleware.auth_required import get_current_user
import hashlib

router = APIRouter()
gemini = GeminiService()
rate_limiter = RateLimitService()
tracker = UsageTracker()

class SummarizeRequest(BaseModel):
    url: str
    title: str
    content: str  # snippet from the article

@router.post('/summarize')
async def summarize_article(
    request: SummarizeRequest,
    user = Depends(get_current_user)
):
    # Check rate limits
    user_limit = rate_limiter.check_user_limit(user['id'])
    if not user_limit['allowed']:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached. Resets at midnight UTC. ({user_limit['remaining']}/{user_limit['limit']})"
        )

    if not rate_limiter.check_global_limit():
        raise HTTPException(
            status_code=503,
            detail="Service capacity reached. Try again later."
        )

    # Check cache first
    # TODO: Implement cache lookup

    # Generate summary
    prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant.
Summarize this article in 2-3 sentences. Be concise and helpful.
Don't sign your response (that's only for terminal commands).

Title: {request.title}
Content: {request.content[:500]}

Summary:"""

    try:
        summary = gemini.generate(prompt, max_tokens=150)

        # Log usage
        tracker.log_usage(user['id'], 'summary', tokens_used=150)

        # TODO: Cache summary

        return {
            'summary': summary,
            'remaining': user_limit['remaining'] - 1
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**1.7 Create Ask Endpoint** (`backend/api/ai/ask.py`)
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.gemini_service import GeminiService
from services.rate_limit_service import RateLimitService
from services.usage_tracker import UsageTracker
from middleware.auth_required import get_current_user

router = APIRouter()
gemini = GeminiService()
rate_limiter = RateLimitService()
tracker = UsageTracker()

class AskRequest(BaseModel):
    question: str

@router.post('/ask')
async def ask_synth(
    request: AskRequest,
    user = Depends(get_current_user)
):
    # Check rate limits
    user_limit = rate_limiter.check_user_limit(user['id'])
    if not user_limit['allowed']:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached. Resets at midnight UTC."
        )

    if not rate_limiter.check_global_limit():
        raise HTTPException(
            status_code=503,
            detail="Service capacity reached. Try again later."
        )

    # Generate response
    prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant for DevPulse.
Answer developer questions with retro vibes. Keep it 2-3 sentences, helpful but fun.
Occasional 80s references are cool. Sign your response with "SYNTH OUT 🌆"

Question: {request.question}

Answer:"""

    try:
        response = gemini.generate(prompt, max_tokens=200)

        # Log usage
        tracker.log_usage(user['id'], 'ask', tokens_used=200)

        return {
            'response': response,
            'remaining': user_limit['remaining'] - 1
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**1.8 Wire Up Routes** (`backend/main.py` or wherever your FastAPI app is)
```python
from api.ai import summarize, ask

app.include_router(summarize.router, prefix='/api/ai', tags=['ai'])
app.include_router(ask.router, prefix='/api/ai', tags=['ai'])
```

---

### Phase 2: Frontend Integration

**2.1 Add Summarize Button to TrendCard** (`frontend/components/TrendCard.tsx`)

Add state and button:
```tsx
const [summary, setSummary] = useState<string | null>(null)
const [loadingSummary, setLoadingSummary] = useState(false)
const [summaryError, setSummaryError] = useState<string | null>(null)

const handleSummarize = async () => {
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    setSummaryError('Please sign in to use AI features')
    return
  }

  setLoadingSummary(true)
  setSummaryError(null)

  try {
    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        url: trend.url,
        title: trend.title,
        content: trend.description || trend.title
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate summary')
    }

    const data = await response.json()
    setSummary(data.summary)
  } catch (err) {
    setSummaryError(err.message)
  } finally {
    setLoadingSummary(false)
  }
}
```

Add button to card:
```tsx
{/* AI Summary Button */}
<button
  onClick={handleSummarize}
  disabled={loadingSummary}
  className="mt-2 flex items-center gap-2 text-xs text-neon-cyan hover:text-neon-magenta transition-colors"
>
  🤖 {loadingSummary ? 'Summarizing...' : 'AI Summary'}
</button>

{/* Show Summary */}
{summary && (
  <div className="mt-3 p-3 bg-dark-hover border border-neon-cyan/30 rounded">
    <p className="text-xs text-gray-300">{summary}</p>
  </div>
)}

{/* Show Error */}
{summaryError && (
  <div className="mt-2 text-xs text-neon-magenta">
    ⚠️ {summaryError}
  </div>
)}
```

**2.2 Add Terminal AI Commands** (`frontend/components/InteractiveTerminal.tsx`)

Add to command handler:
```tsx
// In the command processing section, add:

if (input.startsWith('ask ')) {
  const question = input.substring(4).trim()

  if (!question) {
    addOutput('Usage: ask [your question]', 'error')
    return
  }

  // Check if logged in
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    addOutput('⚠️ Please sign in to use AI features', 'error')
    return
  }

  addOutput(`🤖 SYNTH is thinking...`, 'info')

  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'SYNTH is unavailable')
    }

    const data = await response.json()

    // Type out response with animation
    addOutput(data.response, 'success')
    addOutput(`💭 You have ${data.remaining} AI queries left today`, 'info')
  } catch (err) {
    addOutput(`⚠️ ${err.message}`, 'error')
  }
  return
}

if (input === 'synth' || input === 'ai') {
  addOutput('╔══════════════════════════════════════════════╗', 'info')
  addOutput('║        🤖 SYNTH - Your AI Assistant          ║', 'info')
  addOutput('╠══════════════════════════════════════════════╣', 'info')
  addOutput('║ ask [question]     - Ask SYNTH anything      ║', 'info')
  addOutput('║ explain [topic]    - Explain a concept       ║', 'info')
  addOutput('║                                              ║', 'info')
  addOutput('║ SYNTH is an 80s-inspired AI that helps      ║', 'info')
  addOutput('║ developers learn and code. Powered by        ║', 'info')
  addOutput('║ Google Gemini.                               ║', 'info')
  addOutput('║                                              ║', 'info')
  addOutput('║ Free users: 50 queries/day                   ║', 'info')
  addOutput('╚══════════════════════════════════════════════╝', 'info')
  return
}
```

Update help command to include AI:
```tsx
if (input === 'help') {
  addOutput('╔══════════════════════════════════════════════╗', 'info')
  addOutput('║           DEVPULSE COMMAND CENTER            ║', 'info')
  addOutput('╠══════════════════════════════════════════════╣', 'info')
  // ... existing commands ...
  addOutput('║ 🤖 AI COMMANDS                               ║', 'info')
  addOutput('║ synth              - SYNTH AI info           ║', 'info')
  addOutput('║ ask [question]     - Ask SYNTH anything      ║', 'info')
  addOutput('║ explain [topic]    - Explain a concept       ║', 'info')
  addOutput('╚══════════════════════════════════════════════╝', 'info')
  return
}
```

---

### Phase 3: Database Setup

**Run these in Supabase SQL Editor:**

1. Create tables (see schema above)
2. Enable Row Level Security (RLS)
3. Add policies

```sql
-- Enable RLS
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached summaries
CREATE POLICY "Anyone can read summaries"
  ON ai_summaries FOR SELECT
  USING (true);

-- Policy: Service role can insert summaries
CREATE POLICY "Service role can insert summaries"
  ON ai_summaries FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own usage
CREATE POLICY "Users can view their own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert usage
CREATE POLICY "Service role can insert usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);
```

---

## Testing Checklist

- [ ] Gemini API key works
- [ ] Backend endpoints respond
- [ ] Rate limiting works (try 51 queries)
- [ ] Global limit works (simulate with multiple users)
- [ ] Summarize button appears on cards
- [ ] Summaries display correctly
- [ ] Terminal `ask` command works
- [ ] SYNTH personality comes through
- [ ] Error messages are helpful
- [ ] Works on mobile
- [ ] Auth required (test without login)
- [ ] Caching works (same article = instant response)

---

## Deployment

**Backend:**
```bash
cd backend
pip freeze > requirements.txt
git add .
git commit -m "Add SYNTH AI integration with Gemini"
git push
# Deploy on Render/Railway
# Add GEMINI_API_KEY env var
```

**Frontend:**
```bash
cd frontend
git add .
git commit -m "Add SYNTH AI features (summarize + ask commands)"
git push
# Vercel auto-deploys
```

---

## Future Enhancements (Don't Build Yet)

- [ ] `explain [topic]` command (similar to ask)
- [ ] Typing animation for responses
- [ ] Show "🤖 SYNTH" indicator when user has AI available
- [ ] User settings: Enable/disable AI features
- [ ] Analytics dashboard: AI usage stats
- [ ] Improve caching: Store in Redis for speed
- [ ] Content-aware summaries (gaming vs tech vs space)
- [ ] Multi-language support
- [ ] Voice interface? (way future)

---

## Cost Monitoring

**Track in Supabase:**
```sql
-- Daily AI usage across all users
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_queries,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(tokens_used) as total_tokens
FROM ai_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top users by AI usage
SELECT
  user_id,
  COUNT(*) as queries,
  query_type
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id, query_type
ORDER BY queries DESC
LIMIT 20;
```

**When to upgrade from free tier:**
- Hitting 1,200+ queries/day consistently
- Users complaining about quota limits
- Revenue from Pro users covers costs (~$50-100/mo)

---

## Handoff Notes

**If another chat picks this up:**

1. Read this file completely
2. Check TODO.md for current status
3. Start with Phase 1.1 if nothing is done
4. Test each component before moving to next
5. Commit frequently with clear messages
6. Update TODO as you complete tasks

**Current Status:** Ready to start implementation
**Next Step:** Phase 1.1 - Install google-generativeai package

**Environment variables needed:**
- Backend: `GEMINI_API_KEY` (get from https://aistudio.google.com/app/apikey)
- Backend: `SUPABASE_URL` and `SUPABASE_KEY` (already have these)

**Questions? Check:**
- This file for implementation details
- ROADMAP.md for big picture
- TODO.md for task list
- Git history for recent changes

---

**Last Updated:** 2025-11-06 07:50 AM
**Tokens Remaining:** ~135k
**Status:** Documentation complete, ready to build! 🚀
