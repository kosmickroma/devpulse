# SYNTH AI - Deployment Guide

**Status:** Ready to deploy! 🚀
**Time to deploy:** ~15 minutes

---

## Overview

SYNTH is fully integrated into DevPulse:
- ✅ Backend API endpoints ready
- ✅ Frontend UI complete
- ✅ Rate limiting configured
- ✅ Database schema ready

**What you need:**
1. Gemini API key (FREE)
2. Run SQL in Supabase
3. Deploy backend with env var
4. Test it all

---

## Step 1: Get Gemini API Key (2 minutes)

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"** or **"Get API Key"**
3. Select **"Create API key in new project"** (or use existing)
4. Copy the API key (starts with `AIza...`)

**Save this!** You'll need it in Step 3.

**Free Tier Limits:**
- 15 requests/minute
- 1,500 requests/day
- Perfect for testing and early users

---

## Step 2: Create Database Tables (3 minutes)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your **DevPulse project**
3. Click **SQL Editor** in left sidebar
4. Click **"New Query"**
5. Copy the entire contents of `SYNTH_DATABASE_SETUP.sql`
6. Paste into the SQL editor
7. Click **"Run"** or press Cmd/Ctrl + Enter

**You should see:**
```
✅ SYNTH AI database setup complete!
📊 Tables created: ai_summaries, ai_usage
🔒 Row Level Security enabled
📈 Analytics views created
```

**Verify tables exist:**
- Go to **Table Editor** in sidebar
- You should see: `ai_summaries` and `ai_usage`

---

## Step 3: Deploy Backend (5 minutes)

### Option A: If using Render.com

1. Go to your Render dashboard
2. Find your DevPulse backend service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** (paste your API key from Step 1)
6. Click **"Save Changes"**
7. Render will auto-redeploy (takes 2-3 minutes)

### Option B: If using Railway

1. Go to your Railway project
2. Click your backend service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add:
   - **Variable:** `GEMINI_API_KEY`
   - **Value:** (paste your API key)
6. Railway will auto-redeploy

### Option C: Local Testing

1. Create/edit `.env` file in project root:
```bash
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

2. Install new dependencies:
```bash
pip install google-generativeai supabase
```

3. Run backend:
```bash
cd api
python -m uvicorn main:app --reload --port 8000
```

4. Run frontend (in another terminal):
```bash
cd frontend
npm run dev
```

---

## Step 4: Test SYNTH (5 minutes)

### Test 1: Backend Health Check

Visit: `https://your-backend-url.onrender.com/api/health`

**Expected response:**
```json
{
  "status": "healthy",
  "spiders_available": 3,
  "ai_enabled": true,
  "api_version": "2.0.0"
}
```

If `ai_enabled: false`, check your GEMINI_API_KEY env var.

### Test 2: Sign In

1. Go to https://devpulse-1z8l.vercel.app
2. Click **"SIGN IN"**
3. Sign in with Google, GitHub, or email

### Test 3: AI Summary on Cards

1. After signing in, scan for trends: `scan`
2. Find a trend card
3. Click **"🤖 AI Summary"** button
4. Wait 2-3 seconds
5. **Expected:** Summary appears below button
6. **Check:** Shows "X left today" counter

**If it fails:**
- Check browser console (F12) for errors
- Verify backend URL is correct
- Check GEMINI_API_KEY is set

### Test 4: Terminal AI Command

1. In terminal, type: `synth`
2. **Expected:** Shows SYNTH info box
3. Type: `ask what is React`
4. **Expected:** SYNTH responds in 2-3 seconds with answer
5. **Expected:** Shows "X queries left today"

**If it fails:**
- Type `ask test` and check browser console
- Verify you're signed in
- Check backend logs for errors

---

## Step 5: Verify Everything Works ✅

**Checklist:**
- [ ] Backend `/api/health` shows `ai_enabled: true`
- [ ] Database tables exist (`ai_summaries`, `ai_usage`)
- [ ] Can sign in successfully
- [ ] "🤖 AI Summary" button appears on trend cards
- [ ] Summaries generate successfully
- [ ] `synth` command shows info
- [ ] `ask` command works
- [ ] Rate limit counter shows correctly
- [ ] Error messages display properly

---

## Troubleshooting

### "Authentication required" error

**Problem:** Not signed in
**Solution:** Click "SIGN IN" in navbar

### "Daily limit reached" error

**Problem:** Hit 50 queries/day limit
**Solution:** Wait until midnight UTC, or check `ai_usage` table in Supabase:

```sql
SELECT COUNT(*) FROM ai_usage
WHERE user_id = 'your_user_id'
AND created_at >= NOW() - INTERVAL '24 hours';
```

### "SYNTH is temporarily offline"

**Problem:** GEMINI_API_KEY not set or invalid
**Solution:**
1. Check backend logs
2. Verify API key in environment variables
3. Test API key: https://aistudio.google.com/app/apikey

### "Service capacity reached"

**Problem:** Hit global 1,200 queries/day limit
**Solution:** Check global usage:

```sql
SELECT COUNT(*) FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

If consistently hitting limit, consider:
- Upgrading to Gemini paid tier ($0.00025/request)
- Increasing global limit in `rate_limit_service.py`

### Summaries are slow or timeout

**Problem:** API latency
**Solution:**
- Gemini Flash is usually fast (1-2 seconds)
- Check backend logs for errors
- Verify network connection
- Try again - might be temporary

### Backend won't start

**Problem:** Missing dependencies
**Solution:**
```bash
pip install -r requirements.txt
```

**Problem:** Import errors
**Solution:** Check Python version (need 3.8+)

---

## Monitoring & Analytics

### Check AI Usage Stats

**Daily usage per user:**
```sql
SELECT * FROM daily_ai_usage
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

**Global stats:**
```sql
SELECT * FROM global_ai_stats
ORDER BY date DESC
LIMIT 30;
```

**Top users:**
```sql
SELECT
  user_id,
  COUNT(*) as total_queries,
  query_type
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id, query_type
ORDER BY total_queries DESC
LIMIT 20;
```

**Cost estimation:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as queries,
  SUM(tokens_used) as tokens,
  -- Gemini pricing: $0.00025 per 1K tokens
  ROUND(SUM(tokens_used) * 0.00025 / 1000, 4) as estimated_cost_usd
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Next Steps

Once SYNTH is working:

1. **Monitor usage** - Check daily query counts
2. **Gather feedback** - Ask users what they think
3. **Add more sources** - Gaming (IGN), Space (NASA), etc.
4. **Improve prompts** - Tweak SYNTH's personality based on responses
5. **Add caching** - Implement summary caching to reduce API calls
6. **Consider Pro tier** - When you hit limits or want revenue

---

## Upwork Portfolio

**What to highlight:**
- ✅ "AI-powered developer hub with Google Gemini integration"
- ✅ "Real-time content summarization with rate limiting"
- ✅ "Scalable architecture supporting multiple content types"
- ✅ "User authentication with usage tracking"
- ✅ "Free tier: 50 queries/day, 1500 global/day"

**Demo script:**
1. Show landing page + terminal
2. Sign in
3. Scan trends
4. Click "AI Summary" on a card
5. Type `ask what is TypeScript`
6. Show rate limit counter

---

## Support

**If you get stuck:**
1. Check this guide again
2. Check browser console for errors
3. Check backend logs
4. Review `SYNTH_IMPLEMENTATION.md` for technical details
5. Test with `curl`:

```bash
# Test ask endpoint
curl -X POST https://your-backend.onrender.com/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"question": "test"}'
```

---

**Status:** SYNTH is production-ready! 🤖🌆

**Last Updated:** 2025-11-06
