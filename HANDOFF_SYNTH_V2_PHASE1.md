# SYNTH v2 - Phase 1 Handoff Document

## STATUS: IN PROGRESS - Ready for Multi-Agent Implementation

**Date:** 2025-12-02
**Branch:** `synth-v2` (created, not pushed yet)
**Session Goal:** Build multi-agent orchestrator with Claude + GPT-4o mini + Gemini

---

## WHAT'S DONE ✅

### 1. Production Caching System - FIXED & DEPLOYED
- Database constraint expanded to 14 sources
- Batched backfill (prevents OOM)
- Unified cache loading (frontend fallback)
- **Result:** 13/14 sources caching, cards load instantly
- **Commit:** `a70a5b2` on main branch

### 2. Research Complete
- Studied Google/Perplexity/Netflix AI search architectures
- Latest models identified:
  - **Gemini 2.5 Flash** (main - FREE)
  - **Claude 3.5 Haiku** (conversational - $0.80/M)
  - **GPT-4o mini** (code - $0.15/M)
- Cost: $3-7/month at 100k queries
- Report: `INTELLIGENT_SEARCH_SYSTEMS_2025.md`

### 3. Branch Created
- `synth-v2` branch created locally
- Not pushed yet (do: `git push -u origin synth-v2`)
- Vercel will auto-create preview URL on push

### 4. Existing Code Discovered (EXCELLENT!)
- **Intent Classifier already exists!** `/api/services/intent_classifier.py`
- Pattern-based, <10ms, 85%+ accuracy
- Entity extraction (languages, frameworks, etc.)
- Source detection working
- **This is BETTER than what we planned - use it!**

---

## WHAT NEEDS TO BE BUILT 🚧

### Phase 1: Multi-Agent Orchestrator (3-4 hours)

**Files to Create:**

1. `/api/services/agents/base_agent.py`
   - Abstract base class for all agents
   - Common interface: `async def respond(query, context)`

2. `/api/services/agents/conversation_agent.py`
   - Uses Claude 3.5 Haiku
   - Handles vague queries ("I want to learn something")
   - Asks clarifying questions
   - Remembers context

3. `/api/services/agents/code_agent.py`
   - Uses GPT-4o mini
   - Handles GitHub/technical queries
   - Better at code analysis

4. `/api/services/agents/search_agent.py`
   - Uses Gemini 2.5 Flash (already configured!)
   - Current SYNTH search logic
   - Fast multi-source search

5. `/api/services/agent_router.py`
   - Uses existing `IntentClassifier`
   - Routes to correct agent based on intent
   - Fallback chains if agent fails

6. `/api/services/synth_v2_service.py`
   - Main entry point
   - Backward compatible with v1
   - Orchestrates everything

**API Endpoints to Add:**

```python
# New v2 endpoint (backward compatible)
@app.post("/api/synth/v2/search")
async def synth_v2_search(query: str):
    # Uses multi-agent system

# Keep old endpoint working
@app.post("/api/synth/search")  # Existing
async def synth_search(query: str):
    # Can route to v2 based on feature flag
```

---

## TESTING YOUR BROKEN QUERIES

These queries FAILED in testing - Phase 1 should fix them:

**Query:** "AI projects with 1000+ stars using transformers on github"
- **Current:** Returns Dev.to articles (WRONG)
- **Expected:** GitHub repos only
- **Fix:** Code agent + source routing

**Query:** "show me news on reddit about AI"
- **Current:** Returns Dev.to + HN (WRONG - ignores "reddit")
- **Expected:** Reddit only
- **Fix:** Explicit source detection working

**Query:** "I want to learn something new"
- **Current:** Dumps 15 random cards (BAD UX)
- **Expected:** Claude asks questions, guides user
- **Fix:** Conversation agent

---

## DEPLOYMENT STRATEGY

### Step 1: Build locally on synth-v2 branch
```bash
# Already on synth-v2
git status
# Build Phase 1 files
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "feat: Add multi-agent orchestrator (Phase 1)

- Add conversation agent (Claude 3.5 Haiku)
- Add code specialist (GPT-4o mini)
- Add agent router with fallbacks
- Integrate with existing IntentClassifier
- Backward compatible with SYNTH v1"

git push -u origin synth-v2
```

### Step 3: Test on Vercel Preview
- Vercel auto-creates: `https://devpulse-git-synth-v2-[username].vercel.app`
- Uses production backend (safe - backward compatible)
- Run test queries
- Check browser console

### Step 4: Merge when stable
```bash
git checkout main
git merge synth-v2
git push origin main
```

---

## API KEYS NEEDED

Add to `.env` (backend):
```bash
GEMINI_API_KEY=xxx  # Already set
ANTHROPIC_API_KEY=xxx  # Need to add (Claude)
OPENAI_API_KEY=xxx  # Need to add (GPT-4o mini)
```

Get keys:
- Claude: https://console.anthropic.com
- OpenAI: https://platform.openai.com

---

## CRITICAL REMINDERS

1. **Use existing IntentClassifier** - It's already built and excellent!
2. **Backward compatible** - Don't break existing SYNTH
3. **Feature flag approach** - Can toggle v2 on/off
4. **Test on preview URL** - Don't merge until tested
5. **Cost monitoring** - Track Claude/GPT usage

---

## NEXT SESSION START HERE:

```python
# 1. Create base agent class
# 2. Implement Claude conversation agent
# 3. Implement GPT-4o mini code agent
# 4. Create agent router (uses IntentClassifier)
# 5. Wire into main.py with feature flag
# 6. Test locally
# 7. Push to synth-v2
# 8. Test on Vercel preview
```

**Priority:** Fix the broken queries from testing!

---

## FILES MODIFIED THIS SESSION

- Created branch: `synth-v2`
- No files changed yet (exploration only)
- Main branch has caching fix deployed

**Ready to code Phase 1 multi-agent system!**
