# DevPulse - Task List

## ✅ v1.1 Complete! (2025-10-30)

GitHub API integration is DONE! All 3 platforms (GitHub, Hacker News, Dev.to) are now live and working.

---

## 🚧 Interactive Terminal (In Progress - 2025-10-30)

**What's Built:**
- ✅ Interactive terminal component with command parser
- ✅ FastAPI backend for running spiders via API
- ✅ Real-time data streaming using Server-Sent Events (SSE)
- ✅ Web Audio API sound effects (typing, beeps, success)
- ✅ Commands: `scan`, `scan [platform]`, `scan github [language]`, `help`, `clear`
- ✅ Terminal loads at top of page, stays there
- ✅ Audio activates on first keystroke
- ✅ Live on Vercel frontend

**What's Left:**
- [ ] Better retro terminal sound files (replace Web Audio beeps with actual samples)
- [ ] Deploy backend API so terminal can actually run live scans
- [ ] Add more commands: `filter`, `search`, `theme`
- [ ] ASCII progress bars during scanning
- [ ] Deploy backend to Railway/Render/Fly.io

**Current State:**
Frontend is live at https://devpulse-1z8l.vercel.app/ with terminal UI. Backend API needs deployment to enable actual scanning.

---

## Next Up: Complete Terminal Experience (v2.0)

### For You (Carol):

**Before We Start:**
- [ ] Review GitHub API docs: https://docs.github.com/en/rest/repos/repos
- [ ] Create GitHub Personal Access Token (if needed for higher rate limits)
  - Go to: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select scopes: `public_repo` (read-only is fine)
  - Save token somewhere safe
- [ ] Test current working spiders to confirm baseline:
  ```bash
  cd C:\Users\carol\devpulse
  python run.py --spider hackernews
  python run.py --spider devto
  ```

**Nice to Have:**
- [ ] Think about UI design ideas (wireframes, color schemes)
- [ ] List any specific GitHub features you want (language filters, time ranges, etc.)

---

### For Me (Claude):

**Phase 1: Research & Planning (15 min)**
- [ ] Research GitHub trending API endpoints
- [ ] Determine if official "trending" endpoint exists (may need to use search with sort)
- [ ] Plan data mapping from API response to our TrendingItem model
- [ ] Design rate limiting strategy

**Phase 2: Implementation (30-45 min)**
- [ ] Create `github_api_spider.py` in `devpulse/spiders/`
- [ ] Implement GitHub API client
- [ ] Handle authentication (with and without token)
- [ ] Parse API response into our TrendingItem format
- [ ] Add error handling for rate limits
- [ ] Support language filtering
- [ ] Support time range (day/week/month)

**Phase 3: Integration (15 min)**
- [ ] Update CLI to use new GitHub API spider
- [ ] Remove/deprecate old HTML scraper
- [ ] Update settings if needed
- [ ] Test with live API

**Phase 4: Testing & Documentation (20 min)**
- [ ] Test with various language filters
- [ ] Test with different time ranges
- [ ] Verify rate limiting works
- [ ] Update README - change GitHub from 🟡 to 🟢
- [ ] Update ROADMAP - mark v1.1 as complete
- [ ] Document any API token setup needed

**Phase 5: Git & Cleanup (10 min)**
- [ ] Commit changes with clear messages
- [ ] Update version to v1.1
- [ ] Push to GitHub
- [ ] Test fresh clone to ensure it works

---

## Potential Blockers to Discuss:

1. **API Rate Limits:**
   - Without auth: 60 requests/hour
   - With auth: 5,000 requests/hour
   - Decision: Require token or work within free limits?

2. **Trending Endpoint:**
   - GitHub may not have a direct "trending" API
   - Might need to use: `GET /search/repositories?q=created:>YYYY-MM-DD&sort=stars`
   - This is a workaround - discuss if acceptable

3. **Data Differences:**
   - API gives more data than HTML scraper
   - Should we store additional fields?
   - Keep it simple or maximize data?

---

## Session Structure:

**9:00-9:15** - Quick sync on blockers, decide on approach
**9:15-10:00** - Build GitHub API spider
**10:00-10:20** - Test and debug
**10:20-10:40** - Documentation and cleanup
**10:40-11:00** - Push v1.1, celebrate, plan UI work

---

## After GitHub API is Done:

### Next Priorities:

**Option A: Start UI/UX Work**
- Wireframe the dashboard
- Choose tech stack (React + Tailwind?)
- Design components
- Set up frontend project

**Option B: Add Another Platform**
- Product Hunt (has good API)
- Reddit (official API available)
- Quick win to show momentum

**Option C: Infrastructure**
- Set up database (PostgreSQL?)
- Design data schema
- Plan API endpoints for frontend

**My Recommendation: Option A (UI/UX)**
- You're excited about it
- It's the most visible progress
- We have solid backend already
- Can iterate on data sources later

---

## Questions to Answer Tomorrow:

1. Do we need GitHub token for better rate limits?
2. How many repos should we fetch per request?
3. Keep experimental HTML scraper or delete it?
4. What language filters do you use most? (Python, JavaScript, etc.)
5. When do we start UI work?

---

## Success Criteria for Tomorrow:

- [ ] GitHub API integration working
- [ ] Can filter by language
- [ ] Can filter by time range (day/week/month)
- [ ] Gets at least 25 trending repos
- [ ] No robots.txt issues
- [ ] Documented and tested
- [ ] Pushed to GitHub as v1.1
- [ ] All 3 platforms working (HN, Dev.to, GitHub)

---

**Let's ship v1.1 tomorrow! 🚀**

After that, we build the UI and DevPulse becomes a real SaaS.
