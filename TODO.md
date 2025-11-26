# DevPulse TODO

## 🎯 Current Status
**Version:** v4.1 - SYNTH AI with Multi-Source Intelligence
**Users:** 0 (building something legendary!)
**Last Updated:** 2025-11-24

---

## ✅ Recent Completions

### v4.1 - SYNTH Multi-Source Intelligence (2025-11-24)
- [x] **SYNTH AI Polish - ALL 6 Sources Wired!**
  - [x] Fixed source detection exclusivity bug ("on reddit" now searches ONLY Reddit)
  - [x] Added relevance scoring + progressive refinement to HackerNews & Reddit
  - [x] Created DevToSource with full smart search
  - [x] Created StocksSource (Yahoo Finance API, 100+ ticker mappings)
  - [x] Created CryptoSource (CoinGecko API, 60+ crypto mappings)
  - [x] Applied GitHub's proven patterns (over-fetching, client-side sort) to all sources
  - **Result:** SYNTH now intelligently searches GitHub, HN, Dev.to, Reddit, Stocks, Crypto!

### v4.0 - SYNTH AI Foundation (2025-11-10)
- [x] SYNTH AI with natural language interface
- [x] Clean SYNTH mode visuals (KITT scanner, particles)
- [x] Database caching infrastructure
- [x] Clickable source filter buttons
- [x] Auto-demo mode polish
- [x] Optional sound indicator for office-friendly demos

### v3.0 - Authentication & Jobs (2025-11-05)
- [x] Full auth system (GitHub, Google, Email)
- [x] Jobs directory (100+ companies)
- [x] User sessions and profiles

---

## 🚧 IMMEDIATE PRIORITIES - Next Session

**Goal:** Polish UX and improve performance before scaling

### High Priority (Quick Wins)
- [ ] **SYNTH conversation history persistence** (1-2 hours)
  - [ ] Database schema for chat history
  - [ ] Load previous conversations on page load
  - [ ] "Clear history" button
  - [ ] Per-user conversation storage

- [ ] **Parallel terminal scans** (2-3 hours)
  - [ ] Run all 6 spiders concurrently (10-15s → 3-5s)
  - [ ] Better progress indicators during parallel fetch
  - [ ] Error handling for failed sources
  - [ ] Graceful degradation

- [ ] **Mobile responsiveness** (2-3 hours)
  - [ ] Fix terminal layout on mobile
  - [ ] Mobile-specific demo mode (shorter flow)
  - [ ] Touch-friendly controls
  - [ ] Responsive SYNTH interface

### UX Polish (Medium Priority)
- [ ] Add typing animation for SYNTH responses
- [ ] Add progress counter during cached burst (147/168 items...)
- [ ] Flash/glow effect on cards after SYNTH results
- [ ] Add source filter buttons with counts: "GitHub (47)"
- [ ] Keyboard shortcuts (? for help)
- [ ] Command history (up/down arrows)
- [ ] Tab completion for commands
- [ ] "Last scanned: X ago" timestamp
- [ ] Force refresh button for cache

### Analytics & Tracking
- [ ] Analytics tracking (demo_started, demo_completed, etc.)
- [ ] Track SYNTH query patterns
- [ ] Source usage stats
- [ ] Error monitoring

---

## 📊 Phase 2: Content Sources & Personalization (Weeks 2-4)

**Goal:** More sources + user preferences to make it YOUR command center

### New Content Sources
- [ ] Gaming sources (IGN, GameSpot, Polygon)
- [ ] Space sources (NASA, SpaceX, Space.com)
- [ ] Product Hunt daily trending
- [ ] Lobsters (lobste.rs)
- [ ] Stack Overflow trending
- [ ] More subreddits (user-configurable)

### User Preferences System
- [ ] Interest selection UI (dev, gaming, space, stocks, crypto)
- [ ] Save source preferences to database
- [ ] Per-user default sources
- [ ] "Auto-scan on load" toggle
- [ ] Remember SYNTH mode preference
- [ ] Custom scan filters
- [ ] Default subreddit list per user (Pro tier feature)

### Backend Refactoring
- [ ] Abstract spider interface/base class
- [ ] Source registry system (easier to add sources)
- [ ] Per-user preference API endpoints
- [ ] Caching layer for preferences
- [ ] Better error handling across all APIs

---

## 🎮 Phase 3: Enhanced Arcade & Community (Month 2)

**Goal:** Make it sticky and social

### More Games
- [ ] Breakout/Brick Breaker
- [ ] Pong
- [ ] Tetris clone
- [ ] High score system
- [ ] Global leaderboards
- [ ] Friends leaderboards

### Basic Forum/Community (Backlog)
- [ ] Posts/comments system
- [ ] Voting system
- [ ] Real-time updates (Supabase subscriptions)
- [ ] Forum page with threads
- [ ] Terminal integration for forum

---

## 🏗️ Phase 4: THE KILLER FEATURE - Customizable Dashboard (Month 3-4)

**Goal:** Let users build THEIR perfect command center (THE differentiator!)

### Architecture Planning (DO THIS FIRST! 🚨)
- [ ] Research drag-and-drop libraries (react-grid-layout vs dnd-kit)
- [ ] Design widget system architecture
- [ ] Database schema for user layouts
- [ ] Widget API/plugin system
- [ ] Performance testing plan (lazy loading, virtualization)

### Core Widget System
- [ ] Widget container component
- [ ] Drag-and-drop grid system
- [ ] Resize widgets
- [ ] Save/load layouts (per user)
- [ ] Default templates (coder, trader, gamer)
- [ ] Layout export/import (JSON)

### Built-in Widgets
- [ ] Terminal widget (current terminal)
- [ ] SYNTH Chat widget (dedicated AI)
- [ ] Trending Cards widget (current view)
- [ ] Games Arcade widget
- [ ] Weather widget
- [ ] Stock ticker widget (live updates)
- [ ] Crypto ticker widget (live updates)
- [ ] GitHub stats widget (your repos/activity)
- [ ] Calendar widget
- [ ] Notes/Todo widget
- [ ] RSS feed widget

### Widget Marketplace (Future Vision)
- [ ] User-created widgets
- [ ] Widget store/gallery
- [ ] Widget ratings & reviews
- [ ] Install/uninstall widgets
- [ ] Revenue sharing for creators (70%)

---

## 🚀 Phase 5: Scale & Monetization (Month 5+)

### Pro Features ($9/mo)
- [ ] Unlimited AI queries
- [ ] All content sources
- [ ] Unlimited custom layouts
- [ ] Custom subreddit lists
- [ ] Widget marketplace access
- [ ] Export data
- [ ] Priority support
- [ ] Advanced analytics

### Platform Features
- [ ] Public API
- [ ] Mobile app (React Native)
- [ ] Desktop app (Tauri)
- [ ] Plugin marketplace
- [ ] White-label offering for companies
- [ ] Creator program (revenue sharing)

---

## 🐛 Known Issues / Tech Debt

**Current Issues:**
- [ ] Mobile layout needs work
- [ ] Error handling needs improvement
- [ ] Loading states inconsistent
- [ ] No offline support
- [ ] No PWA features yet

**Architecture Improvements:**
- [ ] Better state management (consider Zustand/Jotai)
- [ ] Component library/design system
- [ ] Shared types between frontend/backend
- [ ] Better error boundaries
- [ ] Logging/monitoring system (Sentry?)
- [ ] E2E tests (Playwright)
- [ ] Performance monitoring

---

## 💡 Ideas Backlog (Not Prioritized)

**Cool Ideas for Later:**
- [ ] Voice interface for SYNTH
- [ ] Dark/light theme toggle (or more themes)
- [ ] Collaborative workspaces
- [ ] Screen sharing for pair programming
- [ ] Code snippet sharing with syntax highlighting
- [ ] Live coding sessions
- [ ] Browser extension
- [ ] Slack/Discord bot integration
- [ ] Email digests (daily trending)
- [ ] Podcast widget (tech podcasts)
- [ ] YouTube tech channels widget
- [ ] Jobs board improvements (salary ranges, remote filter)

---

## 📝 Session Notes
- SYNTH is production-ready with 6 intelligent sources
- Demo mode polished and office-friendly
- All timing issues resolved
- Source detection working perfectly
- Ready to test on Vercel tonight/tomorrow

**Next Focus:** Test SYNTH thoroughly, then decide between:
1. Quick wins (conversation history + parallel scans)
2. Go BIG (widget dashboard architecture)
3. Polish (mobile + UX improvements)
