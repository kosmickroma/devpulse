# Synth AI-Powered Search Integration

## Overview

DevPulse supports **two distinct modes** for content discovery:

### 1. **Standard Mode** (User Preferences)
- Users configure their favorite sources in Settings UI
- Regular automated scraping based on saved preferences
- Results appear in user's main feed automatically
- Uses `user_source_settings` table for configuration

### 2. **Synth Mode** (AI-Powered Custom Search)
- On-demand searches triggered by user questions to Synth AI
- Custom queries crafted by AI based on user intent
- Results returned directly to user (not saved to feed)
- Enables natural language queries like "find repos about arcade games"

---

## Architecture

```
User → Synth AI → Spider (with query parameter) → Results → User
                ↓
        Determines:
        - Which source(s) to search
        - How to formulate the query
        - Which parameters to use
```

---

## Spider Support for Synth Mode

All spiders support dual-mode operation through the `query` parameter:

### GitHub API Spider
```bash
# Standard Mode (trending repos)
scrapy crawl github_api -a language=python -a time_range=daily

# Synth Mode (custom search)
scrapy crawl github_api -a search_query="classic arcade games" -a language=python
```

**Spider parameters:**
- `search_query`: Custom search term (activates Synth mode)
- `language`: Filter by programming language
- `time_range`: daily/weekly/monthly (ignored in Synth mode)

### Reddit API Spider
```bash
# Standard Mode (hot posts from saved subreddits)
scrapy crawl reddit_api -a subreddits_list="python,machinelearning" -a limit=50

# Synth Mode (custom search)
scrapy crawl reddit_api -a subreddits_list="python,machinelearning" -a query="LLM" -a limit=25
```

**Spider parameters:**
- `subreddits_list`: Comma-separated subreddit names
- `query`: Search term (activates Synth mode)
- `limit`: Max posts per subreddit

### Dev.to Spider
```bash
# Standard Mode (popular posts by tag)
scrapy crawl devto -a tag=python -a time_range=week

# Synth Mode (search functionality)
# TODO: Add search parameter support to devto_spider.py
```

### Hacker News Spider
```bash
# Standard Mode (front page)
scrapy crawl hackernews -a page_limit=2

# Synth Mode
# Note: HN doesn't have built-in search API
# Could integrate with Algolia HN Search API in future
```

---

## API Endpoints Needed

### 1. Standard Mode Endpoint
**Purpose:** Trigger scheduled scans based on user preferences

```http
POST /api/scrape/standard
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "user_id": "uuid",
  "sources": ["github", "reddit", "devto"]
}
```

**Backend flow:**
1. Fetch user's `user_source_settings` from database
2. For each enabled source:
   - Extract settings (subreddits, languages, etc.)
   - Trigger spider with Standard Mode parameters
3. Save results to `scan_results` table
4. Update user's feed

### 2. Synth Mode Endpoint
**Purpose:** Execute AI-powered custom search

```http
POST /api/synth/search
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "user_id": "uuid",
  "user_query": "find me repos about classic arcade games",
  "sources": ["github", "reddit"]  // optional, Synth can decide
}
```

**Backend flow:**
1. Synth AI analyzes `user_query`
2. Determines appropriate sources to search
3. Crafts search parameters for each spider:
   ```python
   # Example for GitHub
   {
     "spider": "github_api",
     "params": {
       "search_query": "arcade games retro",
       "language": "",  # or specific if mentioned
     }
   }

   # Example for Reddit
   {
     "spider": "reddit_api",
     "params": {
       "subreddits_list": "gamedev,programming,retrogaming",
       "query": "classic arcade games",
       "limit": 25
     }
   }
   ```
4. Execute spiders in parallel
5. Return aggregated results directly (don't save to feed)

---

## Synth AI Logic

### Natural Language Processing

**User Query Examples:**

| User Says | Synth Interprets | Sources | Parameters |
|-----------|------------------|---------|------------|
| "Find repos about LLMs" | GitHub search | `github_api` | `search_query="LLM machine learning"` |
| "What's trending in Python?" | Multi-source | `github_api`, `reddit_api`, `devto` | `language=python`, `subreddits=python` |
| "Show me arcade game projects" | GitHub repos | `github_api` | `search_query="arcade games"` |
| "Any discussions about TypeScript?" | Reddit, Dev.to | `reddit_api`, `devto` | `query="TypeScript"`, `tag=typescript` |

### Decision Tree

```python
def analyze_user_query(query: str) -> dict:
    """
    Synth analyzes user query and determines search strategy.

    Returns:
        {
            "sources": ["github", "reddit"],
            "searches": [
                {
                    "spider": "github_api",
                    "mode": "synth",
                    "params": {"search_query": "..."}
                },
                {
                    "spider": "reddit_api",
                    "mode": "synth",
                    "params": {"query": "...", "subreddits_list": "..."}
                }
            ]
        }
    """
    # Use Gemini/LLM to:
    # 1. Extract intent (looking for repos? discussions? articles?)
    # 2. Identify topics/keywords
    # 3. Determine best sources
    # 4. Craft optimal search queries
    pass
```

---

## Implementation Checklist

### Phase 1: Backend API ✅
- [x] Reddit spider with dual-mode support
- [x] GitHub spider already has `search_query` parameter
- [x] Database schema for user preferences
- [ ] Create `/api/scrape/standard` endpoint
- [ ] Create `/api/synth/search` endpoint
- [ ] Add Spider execution service/utility

### Phase 2: Synth AI Integration
- [ ] Implement query analysis with Gemini API
- [ ] Build decision logic for source selection
- [ ] Create query transformation logic
- [ ] Add context awareness (user's saved preferences)

### Phase 3: Frontend UI
- [ ] Settings page for source configuration
  - Reddit: subreddit selection
  - GitHub: language preferences
  - Dev.to: tag preferences
- [ ] Synth chat interface for custom searches
- [ ] Display mode indicator (Standard vs Synth results)

### Phase 4: Enhancements
- [ ] Add search history/favorites
- [ ] Allow users to save Synth searches as Standard feeds
- [ ] Multi-source result aggregation and deduplication
- [ ] Relevance scoring for Synth results

---

## Example User Flows

### Flow 1: Setting Up Standard Mode
1. User opens Settings → Sources → Reddit
2. Selects subreddits: `["python", "machinelearning", "datascience"]`
3. Sets limit: `50` posts per subreddit
4. Clicks Save
5. Backend stores to `user_source_settings` table
6. Next automated scan uses these preferences

### Flow 2: Using Synth Mode
1. User types: "Hey Synth, find me some Python web scraping libraries"
2. Synth AI analyzes query
3. Decides to search: GitHub + Reddit
4. Triggers spiders:
   - GitHub: `search_query="python web scraping library"`
   - Reddit: `subreddits="python,webscraping"`, `query="web scraping library"`
5. Returns aggregated results with source tags
6. User sees results instantly in chat

### Flow 3: Hybrid Approach
1. User has Standard Mode configured for daily Python repos
2. Gets regular feed updates every morning
3. User asks Synth: "Find discussions about FastAPI performance"
4. Synth performs one-off Reddit/Dev.to search
5. User gets targeted results without changing Standard settings

---

## Database Schema Reference

### user_source_settings
```sql
{
  "user_id": "uuid",
  "source": "reddit",
  "enabled": true,
  "reddit_settings": {
    "subreddits": ["python", "machinelearning"],
    "limit_per_subreddit": 50
  }
}
```

### synth_search_history (future)
```sql
CREATE TABLE synth_search_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query TEXT,
  sources TEXT[],
  parameters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP
);
```

---

## Code Integration Points

### 1. API Endpoint (FastAPI)
```python
# api/routes/synth.py
@router.post("/synth/search")
async def synth_search(request: SynthSearchRequest, user=Depends(get_current_user)):
    # 1. Analyze query with Gemini
    search_plan = await synth_ai.analyze_query(request.user_query)

    # 2. Execute spiders
    results = await execute_spiders_parallel(search_plan)

    # 3. Return results
    return {"results": results, "sources": search_plan["sources"]}
```

### 2. Spider Execution Service
```python
# api/services/spider_executor.py
async def execute_spider(spider_name: str, params: dict, mode: str):
    """Execute spider with given parameters."""
    cmd = ["scrapy", "crawl", spider_name]

    for key, value in params.items():
        cmd.extend(["-a", f"{key}={value}"])

    # Run spider and capture output
    result = await asyncio.create_subprocess_exec(*cmd, ...)
    return parse_spider_output(result)
```

### 3. Synth AI Service
```python
# api/services/synth_ai.py
async def analyze_query(user_query: str) -> dict:
    """Use Gemini to analyze user query and create search plan."""
    prompt = f"""
    User query: "{user_query}"

    Analyze this query and determine:
    1. Which sources to search (github, reddit, devto, hackernews)
    2. What search parameters to use for each source
    3. Craft optimal search queries

    Return JSON with search plan.
    """

    response = await gemini.generate_content(prompt)
    return json.loads(response.text)
```

---

## Testing

### Manual CLI Testing

**Standard Mode:**
```bash
# Test Reddit standard mode
python run.py --spider reddit_api --subreddits python,machinelearning --limit 50

# Test GitHub standard mode
python run.py --spider github_api --language python --time-range daily
```

**Synth Mode:**
```bash
# Test Reddit Synth mode
python run.py --spider reddit_api --subreddits python,machinelearning --query "LLM" --limit 25

# Test GitHub Synth mode
python run.py --spider github_api --query "arcade games retro"
```

### API Testing
```bash
# Test Synth search endpoint
curl -X POST http://localhost:8000/api/synth/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "user_query": "find me repos about classic arcade games",
    "sources": ["github", "reddit"]
  }'
```

---

## Future Enhancements

1. **Context-Aware Searches**
   - Synth remembers previous searches in conversation
   - "Find more like that" references previous results

2. **Saved Synth Searches**
   - Convert popular Synth queries into Standard Mode feeds
   - "Save this search to my feed"

3. **Cross-Source Intelligence**
   - Deduplicate results (same project on GitHub + Reddit)
   - Rank by relevance across sources

4. **Advanced Filters**
   - Date ranges
   - Minimum stars/score
   - Language detection
   - Content type (tutorial vs discussion vs project)

---

## Questions & Answers

**Q: Can users use both modes simultaneously?**
A: Yes! Standard Mode runs on schedule (daily scans), Synth Mode is on-demand.

**Q: Are Synth results saved to the database?**
A: Initially no (returned directly). Later we can add optional saving.

**Q: How does Synth know which subreddits to search?**
A: Either uses user's saved subreddit preferences OR intelligently selects relevant ones based on query.

**Q: What if a spider doesn't support Synth mode yet?**
A: Synth will skip that source and use others. We'll progressively add support.

---

## Resources

- **Reddit API Docs:** https://www.reddit.com/dev/api
- **GitHub Search API:** https://docs.github.com/en/rest/search
- **PRAW Documentation:** https://praw.readthedocs.io
- **Gemini API:** https://ai.google.dev/docs

---

**Last Updated:** 2025-11-11
**Status:** Phase 1 Complete - Ready for API implementation
