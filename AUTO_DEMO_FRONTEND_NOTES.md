# Auto-Demo Frontend Implementation - Critical Notes

## 🎯 CURRENT STATUS (Before Auto-Compact)

### ✅ BACKEND: 100% COMPLETE
- Cache service working: 168 items cached
- All 4 demo endpoints tested and operational
- Dual-stream scan endpoint ready (`/api/scan?demo=true`)
- Supabase table created and populated
- **Backend URL:** `https://devpulse-api.onrender.com`

### ⏳ FRONTEND: Ready to Build (Phases 3, 4, 5)

---

## 🔊 EXISTING TERMINAL SOUNDS (MUST USE THESE!)

**File:** `frontend/hooks/useTerminalSounds.ts`

```typescript
sounds = {
  typing: '/sounds/ui_hacking_charenter_01.wav',  // For each character typed
  beep: '/sounds/ui_hacking_charscroll.wav',      // For each item displayed
  error: '/sounds/ui_hacking_passbad.wav',        // For errors
  success: '/sounds/ui_hacking_passgood.wav',     // For success/mode changes
}

// All sounds set to volume: 0.3
// Audio must be unlocked on first user interaction
```

**CRITICAL:** Use `playSound()` helper from existing hook - DON'T create new audio instances!

---

## 🎨 EXISTING TERMINAL UX PATTERNS

**File:** `frontend/components/InteractiveTerminal.tsx`

### Key Patterns to Match:

1. **Audio Unlock Pattern** (lines 83-115):
```typescript
// Silent beep trick to unlock audio
const beep = sounds.current.beep
beep.volume = 0
await beep.play()
beep.pause()
beep.currentTime = 0
beep.volume = originalVolume
```

2. **Sound Playing** (existing in component):
```typescript
const playSound = (type: 'typing' | 'beep' | 'error' | 'success') => {
  if (!audioEnabled || !sounds.current[type]) return
  const sound = sounds.current[type]
  if (sound) {
    sound.currentTime = 0
    sound.play().catch(() => {})
  }
}
```

3. **Terminal Lines Structure**:
```typescript
interface TerminalLine {
  id: string
  text: string
  type: 'input' | 'output' | 'success' | 'error' | 'progress'
  timestamp: number
}
```

4. **Scroll Behavior** (line 118-122):
```typescript
// Auto-scroll terminal container (NOT window)
if (terminalContainerRef.current && !isInitialLoad) {
  terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
}
```

5. **Synth Mode Toggle** (lines 137-150):
```typescript
// Existing Ctrl+S / Cmd+S shortcut
// Plays 'success' sound when entering SYNTH mode
// Sets synthMode state + synthJustActivated flag
```

---

## 📐 SCROLL POSITIONING REQUIREMENT

**From user's screenshot:**
- Must show top cyan glow of terminal border
- Must show bottom filter buttons (GitHub, Hacker News, Dev.to, Reddit, Stocks, Crypto)
- Terminal centered with breathing room

**Implementation:**
```typescript
terminalRef.current.scrollIntoView({
  behavior: 'smooth',
  block: 'center',    // Vertical centering
  inline: 'center'    // Horizontal centering
})

// Then lock scroll
document.body.style.overflow = 'hidden'
```

---

## 🎬 DEMO SEQUENCE (EXACT FLOW)

### Timeline:
```
0.0s:  User lands on homepage (external referrer)
       User makes ANY interaction (scroll/click/mouse/key)
       → Demo triggers
       → Smooth scroll terminal to center
       → Lock scroll (overflow: hidden)

0.8s:  Terminal centered
       → Play 'success' sound (terminal "boots")

1.0s:  Type "Initiating DEMO MODE..."
       → Play 'typing' sound for each character
       → ~100ms per character (60 WPM)

2.0s:  Type "/scan all"
       → Same typing sound pattern

2.5s:  Hit ENTER
       → Play 'success' sound
       → Connect to /api/scan?platform=all&demo=true

2.5s-3.5s: CACHED ITEMS BLAST OUT
       → 168 items stream in
       → Play 'beep' sound for EACH item
       → ~2ms per item = ~336ms total

3.5s:  Show "🔄 Fetching latest updates..." status

14-16s: Fresh scan items start arriving
       → Continue playing 'beep' for each item
       → Seamlessly blend with cached

22s:   Scan complete
       → Play 'success' sound

23s:   Type "Initiating SYNTH MODE..."
       → Typing sounds

24s:   Activate SYNTH mode
       → Pink border animates in
       → Play 'success' sound

24.5s: Type "/synth best terminal tools for developers"
       → Typing sounds

25s:   Fetch /api/demo/synth-search
       → Display pre-cached results INSTANTLY
       → Play 'beep' for each result

27s:   Demo complete
       → Type "Try it yourself! Type /help to get started"
       → Unlock scroll (overflow: auto)
       → Enable user input
       → Focus input field
```

---

## 🎮 DEMO TRIGGER LOGIC

```typescript
useEffect(() => {
  // Only for non-logged-in users on homepage landing
  const shouldTrigger =
    !user &&                        // No user session
    !session &&                     // No auth
    window.location.pathname === '/' &&  // Homepage only
    (!document.referrer || !document.referrer.includes(window.location.host))  // External landing

  if (shouldTrigger) {
    const startDemo = () => {
      runAutoDemo()
      removeAllListeners()
    }

    // ANY interaction triggers demo
    window.addEventListener('scroll', startDemo, { once: true })
    window.addEventListener('click', startDemo, { once: true })
    window.addEventListener('mousemove', startDemo, { once: true })
    window.addEventListener('keydown', startDemo, { once: true })
  }
}, [user, session])
```

---

## 🚪 ESCAPE HATCH

```typescript
// Show during demo
<div className="demo-controls">
  <button onClick={skipDemo}>Skip Demo (ESC)</button>
  <button onClick={skipToSignIn}>Skip to Sign In →</button>
</div>

// ESC key listener
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDemoRunning) {
      skipDemo()
    }
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [isDemoRunning])

function skipDemo() {
  // Stop demo
  // Unlock scroll
  // Enable user input
  // Play 'success' sound
}
```

---

## 🔌 API ENDPOINTS TO USE

### 1. Cached Items Burst
```typescript
const response = await fetch('https://devpulse-api.onrender.com/api/demo/cached-items')
const data = await response.json()
// data.items = array of 168 cached items
```

### 2. Dual-Stream Scan
```typescript
const eventSource = new EventSource('https://devpulse-api.onrender.com/api/scan?platform=all&demo=true')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.type === 'cached_item') {
    displayItem(data.data)
    playSound('beep')
  } else if (data.type === 'item') {
    displayItem(data.data)
    playSound('beep')
  } else if (data.type === 'scan_complete') {
    eventSource.close()
    transitionToSynthMode()
  }
}
```

### 3. Synth Demo Results
```typescript
const response = await fetch('https://devpulse-api.onrender.com/api/demo/synth-search')
const result = await response.json()
// result.query = "best terminal tools for developers"
// result.summary = "✨ Based on 47 trending discussions..."
// result.results = [6 pre-cached items]
```

---

## 📝 TYPING ANIMATION HELPER

```typescript
async function simulateTyping(text: string, soundEnabled: boolean = true) {
  const chars = text.split('')

  for (const char of chars) {
    // Append character to terminal
    setCurrentInput(prev => prev + char)

    // Play typing sound
    if (soundEnabled && audioEnabled) {
      playSound('typing')
    }

    // 60 WPM = ~100ms per character
    await sleep(100)
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

---

## 🎨 SYNTH MODE ACTIVATION

```typescript
async function activateSynthMode() {
  // Use existing SYNTH mode state
  setSynthMode(true)
  setSynthJustActivated(true)

  // Play success sound (matches existing behavior)
  playSound('success')

  // Pink border is already handled by existing CSS when synthMode=true
  // No need to add new styles - just set the state!
}
```

---

## ⚠️ CRITICAL: MATCH EXISTING UX EXACTLY

### DO:
- ✅ Use existing `playSound()` function
- ✅ Use existing sound files (ui_hacking_*.wav)
- ✅ Use existing audio unlock pattern
- ✅ Use existing TerminalLine structure
- ✅ Use existing SYNTH mode state/styles
- ✅ Use existing scroll behavior (terminalContainerRef)
- ✅ Match existing timing/feel

### DON'T:
- ❌ Create new Audio instances
- ❌ Add new sound files
- ❌ Change existing sound volumes
- ❌ Modify existing SYNTH mode styles
- ❌ Scroll window (scroll terminal container instead)
- ❌ Break existing keyboard shortcuts

---

## 📂 FILES TO MODIFY

1. **Create:** `frontend/components/AutoDemoController.tsx`
   - Landing detection
   - Trigger setup
   - Demo orchestration

2. **Create:** `frontend/hooks/useAutoDemo.ts`
   - Demo state management
   - Typing animation
   - Sound coordination

3. **Modify:** `frontend/components/InteractiveTerminal.tsx`
   - Add AutoDemoController import
   - Pass necessary refs/functions
   - Add demo mode state

4. **Modify:** `frontend/app/page.tsx` (or wherever terminal lives)
   - Detect auth state
   - Trigger demo for non-logged users

---

## 🧪 TESTING CHECKLIST

- [ ] Demo triggers on scroll (non-logged-in user, homepage)
- [ ] Demo triggers on click (any click except nav)
- [ ] Demo triggers on mouse move
- [ ] Demo triggers on key press
- [ ] Terminal scrolls to perfect position (top glow + bottom filters visible)
- [ ] Scroll locks during demo
- [ ] Typing animation uses existing sounds
- [ ] Typing speed feels natural (60 WPM)
- [ ] Cached items display with beep sounds
- [ ] Fresh scan items blend seamlessly
- [ ] SYNTH mode activates with existing pink border
- [ ] Synth results appear instantly
- [ ] ESC key skips demo
- [ ] Skip buttons work
- [ ] Scroll unlocks after demo
- [ ] User input enabled after demo
- [ ] Logged-in users NEVER see demo
- [ ] Internal navigation doesn't trigger demo

---

## 📊 CURRENT CACHE STATS

```json
{
  "total": 168,
  "by_source": {
    "github": 30,
    "reddit": 60,
    "hackernews": 30,
    "devto": 18,
    "stocks": 15,
    "crypto": 15
  },
  "scraped_at": "2025-11-24T01:03-01:04 UTC"
}
```

Cache refreshes every 3 hours (when background task is added).

---

## 🚀 IMPLEMENTATION ORDER

### Phase 3: Auto-Demo Controller (2-3 hours)
1. Create AutoDemoController component
2. Add landing detection logic
3. Add ANY-interaction triggers
4. Implement scroll positioning + lock
5. Wire up to InteractiveTerminal

### Phase 4: Typing Animation (2 hours)
1. Create simulateTyping() helper
2. Wire up existing playSound()
3. Test timing (60 WPM feels natural)
4. Add cached items burst
5. Add fresh scan connection
6. Test sound coordination

### Phase 5: Synth Transition (1 hour)
1. Use existing setSynthMode(true)
2. Type synth query with animation
3. Fetch pre-cached results
4. Display with existing styles
5. Add completion message
6. Unlock scroll + enable input

---

**NEXT SESSION: Start with Phase 3 - Auto-Demo Controller**

Read this document first, then begin implementation!

---

*Last Updated: November 23, 2025 (before auto-compact)*
*Backend: 100% Complete | Frontend: Ready to Build*
