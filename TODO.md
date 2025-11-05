# DevPulse - Task List

## 🎯 Current Status: Phase 1 - Foundation

**Users:** 0 (but we're building it anyway!)
**Last Updated:** 2025-11-05

---

## ✅ Version History

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

## 🚧 Phase 1: Foundation (Next 3 Months)

### 🔥 This Week - Quick Wins

**Priority 1: Custom Feed Selection (NO AUTH NEEDED)** ✅ COMPLETED
- [x] Add checkboxes to FilterBar for source selection
- [x] Save preferences to localStorage
- [x] Restore on page load
- [x] Show active sources in terminal header
- [x] Update scan command to use saved preferences

**Priority 1.5: Jobs Directory** ✅ COMPLETED (2025-11-05)
- [x] Create jobs.json with 100+ tech companies
- [x] Add terminal commands (jobs, jobs search, jobs [filter])
- [x] Create /jobs landing page with filters
- [x] Add SEO meta tags for discoverability
- [x] Create company submission form (/jobs/submit)
- [x] Add "JOBS" link to navbar

**Priority 2: More Games**
- [ ] Add Breakout/Brick Breaker
- [ ] Add Pong
- [ ] Update 'games' command to list all

**Priority 3: Polish**
- [ ] Add loading states for cold starts
- [ ] Better error messages
- [ ] Keyboard shortcuts help (press '?')

---

### 🔐 User Authentication (Week 2-3)

**Auth System:**
- [ ] Set up Supabase project
- [ ] Add auth UI (login/signup modal)
- [ ] Email/password authentication
- [ ] GitHub OAuth
- [ ] Google OAuth
- [ ] Session management
- [ ] Protected routes

**Profile System:**
- [ ] Create user profiles table
- [ ] Profile page (/profile/[username])
- [ ] Edit profile (name, bio, avatar)
- [ ] Settings panel
- [ ] Public vs private profiles

---

### 📊 Feed Customization (Week 3-4)

**Backend:**
- [ ] User preferences table
- [ ] API endpoints for saving/loading prefs
- [ ] Default preferences on signup

**Frontend:**
- [ ] Settings UI for source selection
- [ ] Language preferences (GitHub)
- [ ] Time range preferences
- [ ] Save/restore from backend (if logged in)
- [ ] Fallback to localStorage (if not logged in)

---

### 🌐 More Sources (Week 4-6)

**Reddit Integration:**
- [ ] Reddit API research
- [ ] Create Reddit spider
- [ ] Support multiple subreddits
- [ ] Add to source selection

**Product Hunt:**
- [ ] Product Hunt API setup
- [ ] Create PH spider
- [ ] Parse daily top products
- [ ] Add to source selection

**Lobsters:**
- [ ] Lobsters scraper (HTML)
- [ ] Parse front page
- [ ] Add to source selection

**Stack Overflow:**
- [ ] SO API setup
- [ ] Parse trending questions
- [ ] Add to source selection

---

### 💬 Basic Forum (Week 6-8)

**Backend:**
- [ ] Posts table (PostgreSQL)
- [ ] Comments table
- [ ] Votes table
- [ ] Real-time subscriptions (Supabase)

**Frontend:**
- [ ] Forum page (/forum)
- [ ] Create post form
- [ ] Post list view
- [ ] Thread view with comments
- [ ] Reply/comment form
- [ ] Upvote/downvote buttons
- [ ] Real-time updates

**Terminal Integration:**
- [ ] `forum` command - open forum
- [ ] `post` command - create post
- [ ] `thread [id]` command - view thread

---

### 🎨 UI/UX Improvements

**Terminal:**
- [ ] Command history (up/down arrows)
- [ ] Tab completion
- [ ] Command aliases
- [ ] Help command improvements
- [ ] Clear command confirmation

**Cards:**
- [ ] Hover animations
- [ ] Quick actions (save, share)
- [ ] Preview images
- [ ] Better mobile layout

**Navigation:**
- [ ] Sticky header
- [ ] Quick links
- [ ] Search bar
- [ ] User menu

---

## 📈 Success Metrics - Phase 1

**By End of Month 3:**
- [ ] 100 signups
- [ ] 20 daily active users
- [ ] 50+ forum posts created
- [ ] 5+ minute avg session time
- [ ] Launch on Product Hunt

---

## 🎮 Phase 2: Community & Content (Months 4-6)

### Channel System
- [ ] Multiple channels (#python, #js, etc.)
- [ ] Create custom channels
- [ ] Channel moderation
- [ ] Real-time chat

### Code Sharing
- [ ] Code snippet editor
- [ ] Syntax highlighting
- [ ] Run code in browser
- [ ] Fork/remix snippets

### Game Creation
- [ ] Built-in code editor (Monaco)
- [ ] Fantasy console (JS runtime)
- [ ] `game create` command
- [ ] `game publish` command
- [ ] Game browser

### Gamification
- [ ] XP system
- [ ] Level progression
- [ ] Badges & achievements
- [ ] Leaderboards
- [ ] Karma from upvotes

---

## 🤖 Phase 3: AI Integration (Months 7-9)

### Vector Search
- [ ] Set up Pinecone
- [ ] Generate embeddings
- [ ] Semantic search API
- [ ] Natural language queries

### AI Code Helper
- [ ] OpenAI API integration
- [ ] `ask` command
- [ ] Code generation
- [ ] Run code inline
- [ ] Share results

### Smart Features
- [ ] Personalized recommendations
- [ ] Auto-categorization
- [ ] Similar post detection
- [ ] Tutorial validation

---

## 🏆 Phase 4: Platform (Months 10-12)

### Creator Program
- [ ] Revenue sharing system
- [ ] Payout integration
- [ ] Analytics dashboard
- [ ] Featured creator spotlight

### API
- [ ] RESTful API
- [ ] WebSocket API
- [ ] Rate limiting
- [ ] Documentation

### Mobile/Desktop
- [ ] React Native app
- [ ] Tauri desktop app
- [ ] Push notifications
- [ ] Offline mode

---

## 🐛 Known Issues

**Current:**
- Frontend package-lock.json has uncommitted changes
- No user accounts yet (everything is ephemeral)
- Only 3 sources (need more)

---

## 💡 Feature Ideas (Backlog)

**Quick Wins:**
- [ ] Dark/light theme toggle
- [ ] Export data (JSON, CSV, Markdown)
- [ ] Share trending lists
- [ ] Browser notifications
- [ ] Keyboard shortcut reference

**Big Ideas:**
- [ ] Live coding sessions
- [ ] Pair programming rooms
- [ ] Code review system
- [ ] Job board integration
- [ ] Conference schedule integration

---

## 🚀 Launch Checklist

**Before Product Hunt Launch:**
- [ ] User accounts working
- [ ] At least 5 sources
- [ ] Forum with 20+ posts
- [ ] Mobile responsive
- [ ] Demo video (2 min)
- [ ] Landing page copy
- [ ] Screenshots
- [ ] Social media accounts
- [ ] Analytics setup
- [ ] Error tracking (Sentry)

---

**Status:** Let's fucking build this! 🔥
