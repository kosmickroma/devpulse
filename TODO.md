# DevPulse - Task List

## 🎯 Current Status: Phase 1 - Foundation + SYNTH AI

**Users:** 0 (but building something SICK!)
**Last Updated:** 2025-11-09

---

## ✅ Version History

**v4.0 - SYNTH AI** (2025-11-09) ⚡ CURRENT
- ✅ SYNTH AI with Gemini integration
- ✅ Natural language interface (no commands needed!)
- ✅ AI-powered search across GitHub, HN, Dev.to
- ✅ Terminator/RoboCop inspired avatar
- ✅ Jaw-dropping visual effects (holographic, glitch, CRT, particles)
- ✅ SYNTH conversation mode
- ✅ Smart query routing (Q&A vs search)

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

## 🚧 IMMEDIATE - Polish & Core UX (This Week)

**Goal:** Make SYNTH stable and UX smooth before adding more features

### High Priority Fixes
- [ ] Add clickable source filter buttons (post-scan)
- [ ] Remove auto-scan on load (make it opt-in)
- [ ] Add "SCAN NOW" button/command hint
- [ ] Fix mobile responsiveness for SYNTH mode
- [ ] Add typing animation for SYNTH responses
- [ ] Test SYNTH search with all sources
- [ ] Add error boundaries for AI failures

### UX Improvements
- [ ] Better loading states for scans
- [ ] Source filter buttons with counts: "GitHub (47)"
- [ ] Multi-source selection with colors
- [ ] Keyboard shortcuts (? for help)
- [ ] Command history (up/down arrows)
- [ ] Tab completion for commands

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
