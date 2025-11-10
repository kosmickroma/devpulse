# DevPulse - Task List

## 🎯 Current Status: Phase 1 - Foundation + SYNTH AI ✅

**Users:** 0 (but building something SICK!)
**Last Updated:** 2025-11-10

---

## ✅ Version History

**v4.0 - SYNTH AI Edition** (2025-11-10) ⚡ CURRENT
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

## 🚧 IMMEDIATE - Next Session Tasks

**Goal:** Test infrastructure and add finishing touches

### High Priority (Ready to Implement)
- [x] Add clickable source filter buttons (post-scan) ✅
- [x] Database caching infrastructure ✅
- [x] Clean up SYNTH visuals ✅
- [ ] **Test caching after Supabase migrations** (migrations ready, just need to verify)
- [ ] Add typing animation for SYNTH responses (would look sick!)
- [ ] Fix mobile responsiveness for SYNTH mode
- [ ] Add source filter buttons with counts: "GitHub (47)"
- [ ] Add keyboard shortcuts (? for help)

### Optional UX Polish
- [ ] Command history (up/down arrows)
- [ ] Tab completion for commands
- [ ] Better error boundaries for AI failures
- [ ] "Last scanned: 2 hours ago" timestamp
- [ ] Force refresh button for cache

### Infrastructure Notes
- ✅ Supabase migrations created: `supabase/migrations/001_scan_results.sql` and `002_user_preferences.sql`
- ✅ All DB operations are optional and fail gracefully
- ✅ App works perfectly without database
- 📝 Migrations have been run in Supabase dashboard
- 📝 Ready to test caching on next deployment

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
- [ ] Refactor spider system for easy source additions
- [ ] Abstract spider interface/base class
- [ ] Source registry system
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
