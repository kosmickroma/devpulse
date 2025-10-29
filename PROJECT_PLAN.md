# DevPulse Development Plan
**80s Sci-Fi SaaS Platform for Developer Trends**

Last Updated: 2025-10-29
Status: 🚀 Ready to Begin Phase 1

---

## 🎯 Vision
Professional SaaS platform that aggregates developer trends with 80s sci-fi aesthetic, AI-powered insights, and cross-platform intelligence. Built to impress both users and potential employers/investors.

## 🏗️ Architecture Decision

### Tech Stack (APPROVED)
```
Frontend: Next.js 14 (App Router) + Tailwind CSS + Framer Motion
Backend: Next.js API Routes (FastAPI optional later)
Database: Supabase (PostgreSQL + Auth + Realtime + Storage)
Scraping: Python/Scrapy workers on Railway (scheduled cron jobs)
Hosting: Vercel (frontend) + Railway (scrapers)
AI: Hybrid approach (OpenAI embeddings + Claude/GPT for summaries)
```

### Why This Stack?
- ✅ Different from Render (user's existing apps)
- ✅ Completely free to start
- ✅ Production-grade, scalable architecture
- ✅ Modern, impressive to employers
- ✅ Each component independently scalable
- ✅ Industry standard tools

### Repository Structure
```
devpulse/
├── frontend/              # Next.js 14 app (NEW)
│   ├── app/              # App router
│   ├── components/       # React components
│   ├── lib/              # Utilities, API clients
│   └── styles/           # Tailwind + 80s theme
├── api/                   # API layer (NEW)
│   └── routes/           # API endpoints
├── scrapers/              # Existing Python scrapers
│   └── devpulse/         # Current Scrapy project
├── shared/                # Shared types, configs (NEW)
├── docs/                  # Documentation (NEW)
└── PROJECT_PLAN.md       # This file
```

---

## 🎨 Key Differentiators (What Makes DevPulse Stand Out)

1. **Cross-Platform Intelligence** - Show when same topic trends across multiple sources
2. **80s Sci-Fi UI** - Unforgettable neon/synthwave aesthetic (cyan, magenta, purple)
3. **Real-Time Updates** - WebSocket connections, live trending
4. **AI-Powered Insights** - Summaries, clustering, natural language search
5. **Momentum Tracking** - "🔥 5000 stars in 24 hours"
6. **Platform Thinking** - Public API + embeddable widgets
7. **GitHub Personalization** - Recommendations based on your tech stack
8. **Historical Analysis** - Trend charts over time

---

## 📋 Development Phases

### ✅ Phase 0: Planning & Setup (CURRENT)
- [x] Define architecture and tech stack
- [x] Create project plan document
- [ ] Set up monorepo structure
- [ ] Initialize Next.js 14 project
- [ ] Set up Supabase project
- [ ] Configure development environment

### 🚀 Phase 1: Core MVP (Week 1)
**Goal: Working 80s sci-fi dashboard with real data**

#### Frontend
- [ ] Initialize Next.js 14 with App Router
- [ ] Set up Tailwind CSS + custom 80s theme
  - [ ] Synthwave color palette (cyan, magenta, purple, neon green)
  - [ ] Custom fonts (retro monospace)
  - [ ] Glow effects, CRT scanlines, grid backgrounds
- [ ] Create main dashboard layout
  - [ ] Hero section with animated terminal
  - [ ] Trend cards with hover effects
  - [ ] Platform filters (GitHub, HN, Dev.to)
  - [ ] Time range selector
  - [ ] Search bar
- [ ] Build reusable components
  - [ ] TrendCard component (with source badge, metrics)
  - [ ] FilterBar component
  - [ ] LoadingSpinner (retro style)
  - [ ] Button components (neon glow)
- [ ] Implement responsive design (mobile-first)

#### Database (Supabase)
- [ ] Create Supabase project
- [ ] Design database schema
  ```sql
  - trending_items (id, title, url, source, author, description,
                    language, stars, score, comments, reactions,
                    category, scraped_at, created_at, metadata)
  - sources (id, name, enabled, last_scraped, config)
  - scrape_jobs (id, source_id, status, started_at, completed_at, items_count)
  ```
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database indexes for performance

#### API Layer
- [ ] Create Next.js API routes
  - [ ] GET /api/trends (with filters, pagination)
  - [ ] GET /api/trends/[id] (single item)
  - [ ] GET /api/sources (list all sources)
  - [ ] GET /api/stats (summary statistics)
- [ ] Implement Supabase client (server-side)
- [ ] Add error handling and validation
- [ ] Set up CORS for API access

#### Scraper Integration
- [ ] Migrate existing scrapers to save to Supabase
  - [ ] Update HackerNews spider
  - [ ] Update Dev.to spider
  - [ ] Test GitHub spider (API integration)
- [ ] Create scraper orchestration script
- [ ] Set up environment variables
- [ ] Test end-to-end data flow

#### Real-Time Features
- [ ] Set up Supabase Realtime subscriptions
- [ ] Implement WebSocket connection in frontend
- [ ] Show live updates when new trends appear
- [ ] Add toast notifications for new items

### 🤖 Phase 1.5: AI Integration (Week 2)
**Goal: Add AI-powered insights that wow users**

#### AI Infrastructure
- [ ] Set up AI service layer
  - [ ] Create `lib/ai/` directory
  - [ ] OpenAI client setup (embeddings)
  - [ ] Anthropic Claude client setup (summaries)
  - [ ] Caching strategy implementation
- [ ] Add database tables
  ```sql
  - ai_summaries (id, trend_id, summary, generated_at)
  - embeddings (id, trend_id, embedding_vector, model)
  - trend_clusters (id, name, trend_ids, created_at)
  ```

#### Feature 1: AI Trend Summaries
- [ ] Implement summary generation function
- [ ] Create prompt templates
- [ ] Add "Why is this trending?" section to cards
- [ ] Background job to generate summaries
- [ ] Cache results in database
- [ ] Add regenerate option

#### Feature 2: Topic Clustering
- [ ] Generate embeddings for all trends
- [ ] Implement clustering algorithm
- [ ] Create cluster visualization UI
- [ ] "Related Trends" section
- [ ] Cross-platform trend detection

#### Feature 3: Natural Language Search
- [ ] Implement NL query parser (LLM-powered)
- [ ] Convert natural language to filter params
- [ ] Enhanced search bar with AI toggle
- [ ] Example queries UI
- [ ] Search history

### 🎨 Phase 2: Polish & Features (Week 3)
**Goal: Professional SaaS features**

#### User Features
- [ ] Share functionality
  - [ ] Twitter share button
  - [ ] LinkedIn share button
  - [ ] Copy link button
  - [ ] Generate share images (OG tags)
- [ ] Filtering enhancements
  - [ ] Multi-select filters
  - [ ] Save filter presets
  - [ ] Advanced search
- [ ] Sorting options
  - [ ] By momentum (velocity)
  - [ ] By score/stars
  - [ ] By recency
  - [ ] By AI relevance

#### Visual Enhancements
- [ ] Animations with Framer Motion
  - [ ] Card entrance animations
  - [ ] Hover effects
  - [ ] Page transitions
  - [ ] Loading states
- [ ] 80s Sci-Fi polish
  - [ ] CRT screen effect (optional toggle)
  - [ ] Scanline animations
  - [ ] Glitch effects on hover
  - [ ] Retro grid background
  - [ ] Neon borders and glows
- [ ] Dark/Light mode toggle (keep 80s vibe in both)

#### Performance
- [ ] Implement infinite scroll or pagination
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] Bundle size optimization
- [ ] Lighthouse audit (aim for 90+)

### 🔐 Phase 3: Authentication & Personalization (Week 4)
**Goal: User accounts and personalized experience**

#### Authentication
- [ ] Set up Supabase Auth
- [ ] Implement sign up / sign in flow
- [ ] GitHub OAuth integration
- [ ] User profile page
- [ ] Protected routes

#### User Features
- [ ] Database schema for users
  ```sql
  - users (extended from Supabase auth)
  - user_preferences (theme, filters, notifications)
  - saved_items (user_id, trend_id, saved_at, notes)
  - collections (id, user_id, name, description, items)
  ```
- [ ] Save favorite trends
- [ ] Create collections
- [ ] User dashboard
- [ ] Notification preferences

#### Personalization
- [ ] GitHub profile sync
  - [ ] Import user's languages
  - [ ] Import starred repos
  - [ ] Import following list
- [ ] AI-powered recommendations
  - [ ] "For You" feed
  - [ ] Personalized daily digest
- [ ] Custom feed builder

### 📊 Phase 4: Analytics & Advanced Features (Week 5+)
**Goal: Historical data and insights**

#### Historical Trends
- [ ] Store historical snapshots
- [ ] Trend charts (Chart.js or Recharts)
  - [ ] Language popularity over time
  - [ ] Topic trends
  - [ ] Platform comparison
- [ ] "This Day Last Year" feature
- [ ] Trend predictions

#### Platform Features
- [ ] Public API
  - [ ] API key generation
  - [ ] Rate limiting
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] Usage dashboard
- [ ] Embeddable widgets
  - [ ] `<script>` tag widget
  - [ ] iframe embed
  - [ ] Customizable themes
  - [ ] Widget builder UI

#### Additional Sources
- [ ] Product Hunt integration
- [ ] Reddit (r/programming, r/webdev)
- [ ] Lobsters
- [ ] Stack Overflow
- [ ] Twitter/X trending

### 🚀 Phase 5: Deployment & Polish (Week 6)
**Goal: Production-ready SaaS**

#### Deployment
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Set up Railway for scrapers
  - [ ] Create Dockerfile
  - [ ] Set up cron jobs
  - [ ] Configure secrets
- [ ] Custom domain setup
- [ ] SSL certificates
- [ ] CDN configuration

#### Monitoring & Analytics
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (Vercel Analytics or Plausible)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Cost tracking

#### Documentation
- [ ] User documentation
- [ ] API documentation
- [ ] Developer setup guide
- [ ] Contributing guidelines
- [ ] Architecture documentation

#### Marketing & Launch
- [ ] Landing page
- [ ] Demo video
- [ ] Screenshots for portfolio
- [ ] Product Hunt launch
- [ ] Share on Twitter, LinkedIn, Reddit
- [ ] Write blog post about building it

---

## 🎨 Design System (80s Sci-Fi Theme)

### Color Palette
```css
/* Primary */
--neon-cyan: #00FFFF
--neon-magenta: #FF00FF
--neon-purple: #9D00FF
--neon-green: #39FF14

/* Background */
--bg-dark: #0a0a0f
--bg-card: #1a1a2e
--bg-hover: #16213e

/* Accent */
--grid-color: #1a1a3e
--glow-color: rgba(0, 255, 255, 0.5)
```

### Typography
- Headers: "Orbitron" or "Exo 2" (sci-fi feel)
- Body: "Space Mono" or "IBM Plex Mono" (retro monospace)
- Code: "Fira Code"

### Visual Effects
- Card glow on hover (box-shadow with neon colors)
- Scanline overlay (subtle animation)
- Grid background (perspective grid)
- CRT curvature (optional, toggle)
- Glitch text effect for loading states
- Neon borders with gradient

### Component Examples
```
┌─────────────────────────────────────────┐
│  🔥 TRENDING NOW                         │
│  ════════════════════════════════════   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🟢 GitHub                          │ │
│  │  facebook / react                   │ │
│  │  ⭐ 234,567 (+5,234 today)         │ │
│  │  💬 1,234 • 🔥 MOMENTUM: High      │ │
│  │                                     │ │
│  │  🤖 AI: Major update with server   │ │
│  │     components...                   │ │
│  │                                     │ │
│  │  [🔗 View] [📤 Share] [💾 Save]    │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 💾 Data Models

### TrendingItem
```typescript
interface TrendingItem {
  id: string
  title: string
  url: string
  source: 'github' | 'hackernews' | 'devto' | 'producthunt' | 'reddit'
  author?: string
  description?: string
  language?: string
  stars?: number
  score?: number
  comments?: number
  reactions?: number
  category: 'repository' | 'article' | 'discussion' | 'product'
  scrapedAt: Date
  createdAt: Date
  metadata: Record<string, any>

  // Computed fields
  momentum?: 'high' | 'medium' | 'low'
  isNew?: boolean
  isCrossPlatform?: boolean

  // AI fields
  aiSummary?: string
  aiTags?: string[]
  relatedTrends?: string[]
}
```

### AISummary
```typescript
interface AISummary {
  id: string
  trendId: string
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  generatedAt: Date
  model: string
}
```

### TrendCluster
```typescript
interface TrendCluster {
  id: string
  name: string
  description: string
  trendIds: string[]
  platforms: string[]
  createdAt: Date
}
```

---

## 🔧 Environment Variables

### Development (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Scrapers
RAILWAY_API_KEY=
SCRAPER_CRON_SECRET=

# Optional
SENTRY_DSN=
ANALYTICS_ID=
```

---

## 📊 Success Metrics

### MVP Launch Goals
- [ ] < 2s page load time
- [ ] 90+ Lighthouse score
- [ ] Mobile responsive (works on all devices)
- [ ] Real-time updates working
- [ ] AI summaries generating correctly
- [ ] 3+ data sources working
- [ ] Zero critical bugs

### Post-Launch Goals
- [ ] 100+ daily active users
- [ ] < 1% error rate
- [ ] 50+ GitHub stars
- [ ] Featured on Product Hunt
- [ ] Positive feedback from developers

---

## 🚨 Known Challenges & Solutions

### Challenge: GitHub Trending Scraping
- **Issue**: GitHub blocks scrapers via robots.txt
- **Solution**: Use official GitHub API (already planned)
- **Status**: Ready to implement

### Challenge: AI Cost Management
- **Issue**: API costs can add up with many requests
- **Solution**: Aggressive caching, generate summaries once per item
- **Status**: Caching strategy documented

### Challenge: Real-Time at Scale
- **Issue**: WebSocket connections can be expensive
- **Solution**: Supabase handles this, use connection pooling
- **Status**: Supabase supports this natively

### Challenge: Scraper Scheduling
- **Issue**: Need reliable cron jobs
- **Solution**: Railway cron or external service (cron-job.org)
- **Status**: Railway supports this

---

## 📝 Notes for Future Chats

### Current Status
- Planning phase complete
- Ready to begin Phase 1 development
- All architectural decisions made
- Waiting for user approval to start coding

### Key Decisions Made
1. ✅ Tech stack: Next.js + Supabase + Railway
2. ✅ 80s sci-fi theme approved
3. ✅ Hybrid AI approach (OpenAI embeddings + Claude/GPT summaries)
4. ✅ Phase-by-phase development plan
5. ✅ Focus on cross-platform intelligence as key differentiator

### Next Steps
1. Initialize Next.js project with proper structure
2. Set up Supabase database
3. Start building 80s sci-fi UI components
4. Migrate scrapers to save to Supabase

### Important Context
- User has 2 apps on Render already (can't use Render database)
- User wants to try something different from Render
- This is both a portfolio piece and potential SaaS product
- Focus on being impressive to employers/investors
- User prefers to work on UI/UX first
- Multiple sources will be added (scalability important)

---

## 🎯 Quick Reference Commands

### Development
```bash
# Frontend
cd frontend && npm run dev

# Run scrapers locally
cd scrapers && python run.py --all

# Database migrations
npx supabase db push

# Type checking
npm run type-check
```

### Deployment
```bash
# Deploy frontend
vercel --prod

# Deploy scrapers
railway up

# Run migrations
npm run migrate
```

---

**Last Updated**: 2025-10-29
**Current Phase**: Phase 0 - Planning Complete ✅
**Next Milestone**: Initialize Next.js project and start Phase 1
**Status**: 🚀 Ready to build!
