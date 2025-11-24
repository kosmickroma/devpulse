# Auto-Demo Mode Implementation Guide

## 🎯 Overview
Auto-demo mode showcases DevPulse's speed and features to first-time visitors through an automated, interactive demonstration.

## 🏗️ Architecture

### Backend (✅ COMPLETE - Phase 1 & 2)

#### 1. **Cache Service** (`api/services/demo_cache_service.py`)
- Stores 60 most recent items per source (360 total)
- Refreshes every 3 hours via background task
- Provides instant randomized burst for demo mode

#### 2. **Demo Endpoints** (`api/main.py`)
```python
GET /api/demo/cached-items       # Get 360 shuffled cached items
GET /api/demo/synth-search       # Get pre-cached Synth results
POST /api/demo/refresh-cache     # Manually trigger cache refresh
GET /api/demo/cache-stats        # Get cache statistics
```

#### 3. **Modified Scan Endpoint** (`api/main.py`)
```python
GET /api/scan?demo=true          # Dual-stream: cached burst + fresh scan
```

**Flow:**
1. Instant cached burst (360 items in <1s)
2. Transition message ("🔄 Fetching latest updates...")
3. Fresh scan continues normally (14-22s)

#### 4. **Database** (Supabase)
```sql
CREATE TABLE cached_demo_items (
  id uuid PRIMARY KEY,
  source text NOT NULL,
  item_data jsonb NOT NULL,
  scraped_at timestamp,
  rank int CHECK (rank >= 1 AND rank <= 60),
  UNIQUE(source, rank)
);
```

**To create table:** Run `supabase_migrations/create_demo_cache_table.sql` in Supabase SQL editor

---

### Frontend (⏳ PENDING - Phase 3, 4, 5)

#### Phase 3: Auto-Demo Controller

**File:** `src/components/Terminal/AutoDemoController.tsx` (or similar)

**Trigger Logic:**
```typescript
useEffect(() => {
  // Only trigger for non-logged-in users on homepage landing
  const shouldTrigger =
    !user &&                      // Not logged in
    !session &&                   // No session
    window.location.pathname === '/' &&  // Homepage
    (!document.referrer || !document.referrer.includes(window.location.host)); // External landing

  if (shouldTrigger) {
    // Trigger on ANY interaction
    const startDemo = () => {
      runAutoDemo();
      removeListeners();
    };

    window.addEventListener('scroll', startDemo, { once: true });
    window.addEventListener('click', startDemo, { once: true });
    window.addEventListener('mousemove', startDemo, { once: true });
    window.addEventListener('keydown', startDemo, { once: true });
  }
}, [user, session]);
```

**Scroll Positioning:**
```typescript
async function runAutoDemo() {
  // Smooth scroll terminal to center (show top glow + bottom filters)
  terminalRef.current.scrollIntoView({
    behavior: 'smooth',
    block: 'center',  // Center vertically
    inline: 'center'   // Center horizontally
  });

  // Lock scroll during demo
  document.body.style.overflow = 'hidden';

  // Wait for scroll to complete
  await sleep(800);

  // Start demo sequence
  await runDemoSequence();

  // Unlock scroll after demo
  document.body.style.overflow = 'auto';
}
```

#### Phase 4: Typing Animation

**Functions needed:**
```typescript
async function simulateTyping(text: string, speed: number = 60) {
  // 60 WPM = ~100ms per character
  for (const char of text) {
    appendToTerminal(char);
    playTypingSound();
    await sleep(100);
  }
}

function playTypingSound() {
  // Play subtle keyboard tap sound
  const audio = new Audio('/sounds/key-tap.mp3');
  audio.volume = 0.3;
  audio.play();
}

function playBeep() {
  // Play terminal beep for each item
  const audio = new Audio('/sounds/beep.mp3');
  audio.volume = 0.5;
  audio.play();
}
```

**Demo Sequence:**
```typescript
async function runDemoSequence() {
  // Auto-click terminal
  terminalRef.current.click();
  playClickSound();
  await sleep(500);

  // Type "Initiating DEMO MODE..."
  await simulateTyping('Initiating DEMO MODE...');
  await sleep(500);

  // Type "/scan all"
  await simulateTyping('/scan all');
  await sleep(300);

  // Hit ENTER
  playEnterSound();

  // Connect to scan endpoint with demo=true
  const eventSource = new EventSource('/api/scan?platform=all&demo=true');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'cached_item') {
      // Display cached item immediately
      displayItem(data.data);
      playBeep();
    } else if (data.type === 'item') {
      // Display fresh item
      displayItem(data.data);
      playBeep();
    } else if (data.type === 'scan_complete') {
      // Demo complete, transition to Synth mode
      eventSource.close();
      await sleep(1000);
      await transitionToSynthMode();
    }
  };
}
```

#### Phase 5: Synth Mode Transition

```typescript
async function transitionToSynthMode() {
  // Type "Initiating SYNTH MODE..."
  await simulateTyping('Initiating SYNTH MODE...');
  await sleep(500);

  // Animate pink border
  terminalRef.current.classList.add('synth-mode');

  // Type pre-staged query
  await simulateTyping('/synth best terminal tools for developers');
  await sleep(300);
  playEnterSound();

  // Fetch pre-cached results
  const response = await fetch('/api/demo/synth-search');
  const result = await response.json();

  // Display results instantly
  displaySynthSummary(result.summary);
  for (const item of result.results) {
    displayItem(item);
    playBeep();
    await sleep(150); // Slight delay between items for effect
  }

  // Show completion message
  await sleep(1000);
  await simulateTyping('Demo complete! Type /help to get started.');

  // Give control back to user
  enableUserInput();
}
```

**Escape Hatch:**
```typescript
<DemoOverlay visible={isDemoRunning}>
  <button onClick={skipDemo} className="skip-btn">
    Skip Demo (ESC)
  </button>
  <button onClick={skipToSignIn} className="signin-btn">
    Skip to Sign In →
  </button>
</DemoOverlay>

// Listen for ESC key
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDemoRunning) {
      skipDemo();
    }
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isDemoRunning]);
```

---

## 🎬 Complete User Experience Flow

### Timeline:
```
0.0s:  User lands on homepage from external link
0.0s:  User scrolls/clicks/moves mouse (ANY interaction)
       → Demo triggers
       → Smooth scroll to terminal (center, showing top glow + bottom filters)
       → Scroll locked

0.8s:  Terminal centered and auto-clicks
       → Sound: *click*

1.0s:  Types "Initiating DEMO MODE..."
       → Typing sounds

2.0s:  Types "/scan all"
       → Typing sounds

2.5s:  Hits ENTER
       → 💥 CACHED ITEMS EXPLODE OUT
       → 360 items stream in ~720ms
       → BEEP BEEP BEEP (terminal sounds)

3.5s:  "🔄 Fetching latest updates..."
       → Brief pause

14-16s: Fresh items start flowing in
       → Seamlessly blend with cached items

22s:   Scan complete

23s:   Types "Initiating SYNTH MODE..."
       → Pink border animates in

24s:   Types "/synth best terminal tools for developers"

24.5s: 💥 INSTANT cached Synth results
       → Summary appears
       → Results stream in

27s:   Demo complete
       → "Try it yourself! Type /help to get started"
       → Scroll unlocked
       → User input enabled
```

---

## 📋 Implementation Checklist

### Backend ✅ COMPLETE
- [x] Create `demo_cache_service.py`
- [x] Add demo endpoints to `main.py`
- [x] Modify `/api/scan` for demo mode
- [x] Create Supabase migration SQL

### Database ⏳ PENDING
- [ ] Run SQL migration in Supabase
- [ ] Test table creation
- [ ] Populate initial cache (run `/api/demo/refresh-cache`)

### Frontend ⏳ PENDING
- [ ] Create `AutoDemoController` component
- [ ] Implement landing detection logic
- [ ] Implement scroll positioning with lock
- [ ] Create typing animation functions
- [ ] Add sound effects (key-tap, beep, click, enter)
- [ ] Implement demo sequence orchestration
- [ ] Create Synth mode transition
- [ ] Add escape hatch (Skip buttons + ESC key)
- [ ] Test on multiple screen sizes

---

## 🎯 Testing Plan

1. **Run SQL migration** in Supabase
2. **Populate cache:** `POST /api/demo/refresh-cache`
3. **Test cache stats:** `GET /api/demo/cache-stats`
4. **Test cached items:** `GET /api/demo/cached-items`
5. **Test demo scan:** `GET /api/scan?platform=all&demo=true`
6. **Test Synth cache:** `GET /api/demo/synth-search`

---

## 🚀 Next Steps

**Ready to implement frontend (Phases 3, 4, 5)?**

Let me know when you want to:
1. Run the Supabase migration
2. Populate the initial cache
3. Start building the frontend auto-demo controller

---

*Last Updated: November 23, 2025*
*Status: Backend complete, frontend pending*
