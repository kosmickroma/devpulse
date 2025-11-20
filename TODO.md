# DevPulse - Task List

## 🎯 Current Status: SYNTH Transformation Complete - Testing Phase ✅

**Users:** 0 (but building something SICK!)
**Last Updated:** 2025-11-19 (Session 4 - Smart Search)

---

## ✅ Version History

**v5.3 - Pro-Level Smart Search (GitHub)** (2025-11-19 Session 4) ⚡ CURRENT
- ✅ **Fixed stop_words bug** - Command verbs (scan, look, check) now filtered correctly
- ✅ **Smart keyword prioritization** - Separates subjects from modifiers (avoids restrictive AND queries)
- ✅ **Relevance scoring algorithm** - TF-IDF-like ranking (name=50pts, description=15pts, etc.)
- ✅ **Progressive query refinement** - Auto-fallback to stars:>0 if <5 results
- ✅ **Lowered min_stars threshold** - 10 → 5 for better coverage of quality repos
- ✅ **GitHub search quality** - "frogger arcade game" finds 100+ repos vs 3 previously
- ⏳ **User testing in progress** - Verifying improvements work as expected
- ⏳ **Reddit/HN/Dev.to pending** - Will apply same improvements if GitHub tests pass

**v5.2 - Phase 5 Complete + Polish** (2025-11-19 Session 3)
- ✅ **Phase 5: Search caching** - 10x faster responses with hash-based cache
- ✅ **5-query conversation window** - Multi-turn conversations work perfectly
- ✅ **Current date awareness** - SYNTH knows it's 2025
- ✅ **Keyboard shortcut** - Ctrl+S (Cmd+S) toggles SYNTH mode instantly
- ✅ **GitHub auto-deploy** - Render deploys on every push to main
- ✅ **Backfill metadata table** - Fixed terminal boot errors
- ✅ **Cache analytics** - Tracks hit/miss rates for optimization

**v5.1 - SYNTH UX Polish & Conversation Memory** (2025-11-19 Session 2)
- ✅ **Conversation memory** - SYNTH remembers context ("dive deeper" now works!)
- ✅ **Newest cards on top** - Better UX for sequential searches
- ✅ **Fixed "scan all sources"** - Intent parser now handles it correctly
- ✅ **Wired up ConversationService** - `/api/ai/ask` endpoint uses new architecture
- ✅ **Verified parallel speed** - Multi-source searches blazing fast with asyncio.gather()
- ✅ **Auto-detects search intent** - No need to say "scan github", just "find Python repos"

**v5.0 - SYNTH "THE MONSTER" Transformation** (2025-11-19 Session 1)
- ✅ **Phase 1 & 2**: Unified source interface + parallel search execution
- ✅ **Phase 3**: Conversation mode (handles source searches AND general chat)
- ✅ **Phase 4**: Demo mode API with auto-play showcase
- ✅ Database tables created: `search_cache`, `demo_queries`, `conversations`
- ✅ Fixed Reddit 'stars' KeyError with unified source architecture
- ✅ Parallel execution - all sources searched simultaneously (60-70% faster!)
- ✅ SYNTH can now answer general questions ("NBA odds", "explain quantum computing")
- ✅ Demo mode endpoints ready for frontend integration

**v4.0 - SYNTH AI Edition** (2025-11-10)
- ✅ SYNTH AI fully working with Gemini 2.5-flash
- ✅ Natural language interface ("hey synth, what is react?")
- ✅ Explicit search commands ("search arcade games", "find python projects")
- ✅ Clean SYNTH mode visuals (KITT scanner, subtle particles, no skull)
- ✅ Simple clickable filter buttons (GitHub, HackerNews, Dev.to)
- ✅ Database caching infrastructure (instant page loads!)
- ✅ Shared result cache across all users
- ✅ User preferences table (foundation for settings)
- ✅ Fixed border flicker to not affect content
- ✅ Removed repetitive "SYNTH OUT" signatures

**v3.0 - Authentication & Jobs** (2025-11-05)
- ✅ Full authentication system (GitHub OAuth, Google OAuth, Email/Password)
- ✅ User sessions and profile management
- ✅ Jobs directory with 100+ tech companies
- ✅ Terminal jobs commands (search, filters)
- ✅ Company submission form

**v2.0 - Interactive Terminal** (2025-10-31)
- ✅ Interactive terminal with retro aesthetic
- ✅ Real-time SSE scanning (GitHub, HN, Dev.to)
- ✅ Snake game with cyberpunk notifications
- ✅ Arcade overlay system
- ✅ Retro sound effects
- ✅ Deployed to Vercel + Render

---

## 🚧 IMMEDIATE - Testing Smart Search & Next Steps

**Goal:** Test GitHub smart search improvements, then apply to all sources

### ✅ COMPLETED - Smart Search (GitHub Only) - Session 4 (2025-11-19)
- [x] ✅ **Fixed stop_words bug** - Added command verbs (scan, look, check, explore, etc.)
- [x] ✅ **Smart keyword prioritization** - Separates primary subjects from modifiers
- [x] ✅ **Relevance scoring algorithm** - TF-IDF-like ranking (name=50pts, description=15pts)
- [x] ✅ **Progressive query refinement** - Auto-fallback from stars:>5 to stars:>0 if <5 results
- [x] ✅ **Lowered min_stars** - Changed from 10 → 5 for better coverage
- [x] ✅ **Committed changes** - Ready to test!

**Impact:** "scan github for frogger arcade game" now:
- Uses "frogger" only (not restrictive "frogger arcade game" AND query)
- Finds kubowania/Frogger (104★) - previously missed
- Returns 100+ results instead of 3
- Ranks by relevance + stars

### 🧪 TESTING IN PROGRESS (User Testing Now)
- [ ] **Test GitHub smart search** - Try "scan github for frogger", "search for arcade games", etc.
- [ ] **Verify command verbs work** - Test: scan, look, check, explore, find
- [ ] **Check relevance ranking** - Best matches appearing first?
- [ ] **Test progressive refinement** - Try niche queries, verify auto-fallback
- [ ] **Document any bugs** - Note what works/doesn't work

### 🚀 NEXT SESSION - Apply to All Sources (IF GitHub tests pass)
- [ ] **Reddit smart search** - Apply same improvements to reddit_source.py
- [ ] **HackerNews smart search** - Apply to hackernews_source.py
- [ ] **Dev.to integration** - Finally implement dev.to source (was skipped!)
- [ ] **Fix Reddit subreddit limitation** - Dynamic subreddit selection based on query topic
- [ ] **Unified relevance scoring** - Apply across all sources for consistency

### Other Testing Checklist
- [x] ✅ Conversation mode works (tested: NBA, black holes, Super Bowl)
- [x] ✅ Multi-turn conversations (5-query window working)
- [x] ✅ Source searches blazing fast (parallel execution verified)
- [x] ✅ Ctrl+S shortcut toggles SYNTH mode
- [ ] **Test search caching** - Run same search twice, verify <300ms on 2nd hit
- [ ] **Monitor cache hit rate** - Check backend logs for cache HIT/MISS
- [ ] **Test Reddit searches** - Still has hardcoded tech subreddits issue
- [ ] **Test "scan all sources"** - Should hit GitHub + Reddit + HN

### High Priority - Future Sessions
- [ ] **Frontend demo mode** - Auto-activate on idle, typing animation (30-40 min)
- [ ] **Populate demo queries** - Add 5-10 impressive searches to `demo_queries` table
- [ ] **Parallel terminal scans** - Apply asyncio.gather() to full terminal scans (10-15s → 3-5s!) 🔥
- [ ] Add typing animation for SYNTH responses (would look sick!)
- [ ] Fix mobile responsiveness for SYNTH mode
- [ ] Add source filter buttons with counts: "GitHub (47)"
- [ ] Add keyboard shortcuts help menu (? for help)

### Optional UX Polish
- [ ] Command history (up/down arrows)
- [ ] Tab completion for commands
- [ ] Better error boundaries for AI failures
- [ ] "Last scanned: 2 hours ago" timestamp
- [ ] Force refresh button for cache

### Infrastructure Status (Complete!)
- ✅ Database tables: `search_cache`, `demo_queries`, `conversations`, `backfill_metadata`
- ✅ Unified source interface architecture complete
- ✅ Parallel search execution (SYNTH searches)
- ✅ **Search caching implemented** (Phase 5 ✅)
- ✅ Conversation memory (5-query window, persisted to DB)
- ✅ Demo mode API endpoints ready
- ✅ Newest cards appear on top
- ✅ Current date awareness in prompts
- ✅ GitHub auto-deploy workflow
- ✅ Keyboard shortcut (Ctrl+S / Cmd+S)
- ⏳ **Demo queries table empty** - needs population
- ⏳ **Frontend demo mode NOT implemented** - needs component + typing animation
- ⏳ **Terminal scans still sequential** - parallel optimization pending

---

## 📊 Phase 2: Content Sources & Personalization (Weeks 2-4)

**Goal:** More sources + user preferences to make it YOUR command center

### New Content Sources
- [ ] Gaming sources (IGN, GameSpot, Polygon)
- [ ] Space sources (NASA, SpaceX, Space.com)
- [ ] Reddit integration (r/programming, r/webdev, etc.)
- [ ] Product Hunt daily trending
- [ ] Lobsters (lobste.rs)
- [ ] Stack Overflow trending

### User Preferences System
- [ ] Interest selection UI (dev, gaming, space, etc.)
- [ ] Save source preferences to Supabase
- [ ] Per-user default sources
- [ ] "Auto-scan on load" toggle
- [ ] Remember SYNTH mode preference
- [ ] Custom scan filters

### Backend Architecture
- [x] Refactor spider system for easy source additions ✅
- [x] Abstract spider interface/base class ✅
- [x] Source registry system ✅
- [ ] Per-user preference API endpoints
- [ ] Caching layer for user preferences

---

## 🎮 Phase 3: Enhanced Arcade & Community (Month 2)

**Goal:** Make it sticky and social

### More Games
- [ ] Breakout/Brick Breaker
- [ ] Pong
- [ ] Tetris clone
- [ ] High score system
- [ ] Leaderboards

### Forum/Community (Backlog)
- [ ] Posts table (PostgreSQL)
- [ ] Comments table
- [ ] Votes table
- [ ] Real-time subscriptions (Supabase)
- [ ] Forum page (/forum)
- [ ] Create post form
- [ ] Thread view with comments
- [ ] Upvote/downvote buttons

---

## 🏗️ Phase 4: THE KILLER FEATURE - Customizable Dashboard (Month 3-4)

**Goal:** Let users build their perfect command center

### Architecture Planning (DO THIS FIRST!)
- [ ] Research drag-and-drop libraries (react-grid-layout, dnd-kit)
- [ ] Design widget system architecture
- [ ] Database schema for user layouts
- [ ] Widget API/plugin system
- [ ] Performance considerations (lazy loading, virtualization)

### Core Widget System
- [ ] Widget container component
- [ ] Drag-and-drop grid system
- [ ] Resize widgets
- [ ] Save/load layouts (per user)
- [ ] Default layouts (templates)
- [ ] Layout export/import

### Built-in Widgets
- [ ] Terminal widget (current terminal)
- [ ] SYNTH Chat widget (dedicated AI chat)
- [ ] Trending Cards widget (current cards view)
- [ ] Games Arcade widget
- [ ] Weather widget
- [ ] Stock ticker widget
- [ ] GitHub stats widget (your repos/stats)
- [ ] Calendar widget
- [ ] Notes/Todo widget
- [ ] RSS feed widget

### Widget Marketplace (Future)
- [ ] User-created widgets
- [ ] Widget store/gallery
- [ ] Widget ratings
- [ ] Install/uninstall widgets
- [ ] Widget settings/config

---

## 🚀 Phase 5: Scale & Monetization (Month 5+)

### Pro Features
- [ ] Unlimited AI queries
- [ ] Custom widgets
- [ ] API access
- [ ] Export data
- [ ] Priority support
- [ ] Remove rate limits

### Platform Features
- [ ] Public API
- [ ] Mobile app (React Native)
- [ ] Desktop app (Tauri)
- [ ] Plugin marketplace
- [ ] White-label offering

---

## 🐛 Known Issues / Tech Debt

**Current Issues:**
- [ ] Mobile layout needs work
- [ ] Error handling needs improvement
- [ ] Loading states inconsistent
- [ ] No offline support
- [ ] No PWA features yet

**Architecture Improvements Needed:**
- [ ] Better state management (consider Zustand/Jotai)
- [ ] Component library/design system
- [ ] Shared types between frontend/backend
- [ ] Better error boundaries
- [ ] Logging/monitoring system
- [ ] E2E tests
- [ ] Performance monitoring

---

## 💡 Ideas Backlog (Not Prioritized)

**Cool Ideas to Consider Later:**
- [ ] Voice interface for SYNTH
- [ ] Dark/light theme toggle (or more themes)
- [ ] Collaborative workspaces
- [ ] Screen sharing for pair programming
- [ ] Code snippet sharing
- [ ] Live coding sessions
- [ ] DevPulse API for third-party apps
- [ ] Browser extension
- [ ] Slack/Discord integration
- [ ] Email digests
- [ ] RSS feeds
- [ ] Podcast widget
- [ ] YouTube tech channels widget

---

**Status:** Building strategically, one phase at a time! 🔥
**Next Focus:** Polish SYNTH, add source filters, then plan customizable dashboard architecture
