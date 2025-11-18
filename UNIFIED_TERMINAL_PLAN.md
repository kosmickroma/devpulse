# 🖥️ Unified Terminal System - Implementation Plan

**Status:** Ready to implement
**Estimated Effort:** Medium-Large (4-6 hours)
**Priority:** High (fixes audio bug + adds cool multi-terminal UX)

---

## Problem Statement

DevPulse has **4 independent terminal instances** with no synchronization:
- Home page terminal (full InteractiveTerminal)
- Arcade terminal (custom implementation)
- Vault terminal (custom implementation)
- Command Center (TerminalWidget + CommandWidget)

**Current Issues:**
1. ❌ Scans continue playing audio when navigating away (EventSource leak)
2. ❌ Each terminal powers on/off independently
3. ❌ No way to see what other terminals are doing
4. ❌ Command Widget not wired to terminals
5. ❌ Code duplication across terminals

---

## User Vision

**Option A:** All terminals mirror each other exactly (same output everywhere)
**Option B:** Terminals show indicators + can still be used independently

**Going with Option B** - Best of both worlds!

---

## Solution: Global Terminal Context

### Architecture
```
TerminalContext (Global State Provider)
    ├── Shared State: isScanning, scanProgress, isPoweredOn, audioEnabled
    ├── Shared EventSource (proper cleanup!)
    ├── Global audio system
    └── Methods: startScan(), stopScan(), cleanup(), executeCommand()
         │
         ├── Home Terminal (uses context)
         ├── Arcade Terminal (uses context)
         ├── Vault Terminal (uses context)
         └── Command Center
              ├── TerminalWidget (uses context)
              └── CommandWidget (controls all terminals)
```

### Key Features

1. **Scan Indicators** - All terminals show when ANY terminal is scanning
   ```
   ⚡ SCANNING: Home Terminal - 45%
   [Press Ctrl+M to mirror]
   ```

2. **Power State Sync** - Power on once, all terminals are on

3. **Audio Cleanup** - Stops audio when you navigate away (fixes current bug)

4. **Command Widget Control** - Control all terminals from Command Center
   - `scan` - Start scan from any terminal
   - `power off` - Turn off all terminals
   - `audio toggle` - Global audio control

5. **Optional Mirror Mode** - Press Ctrl+M to see exact output from other terminal

---

## Implementation Phases

### Phase 1: Create Terminal Context (2 hours)
- [ ] Create `frontend/context/TerminalContext.tsx`
- [ ] Create `frontend/hooks/useTerminal.ts`
- [ ] Wrap app in provider (`app/layout.tsx`)
- [ ] Move EventSource to context with proper cleanup
- [ ] Move audio system to context

**Files to create:**
- `frontend/context/TerminalContext.tsx` (~200 lines)
- `frontend/hooks/useTerminal.ts` (~50 lines)

**Files to modify:**
- `frontend/app/layout.tsx` (add provider)

### Phase 2: Fix Audio/EventSource Leak (30 mins)
- [ ] Implement cleanup() in context
- [ ] Close EventSource on navigation
- [ ] Stop all sounds on cleanup
- [ ] Test: scan on home → navigate to arcade → audio should stop

**Files to modify:**
- `frontend/context/TerminalContext.tsx` (cleanup logic)

### Phase 3: Update InteractiveTerminal (1 hour)
- [ ] Connect to TerminalContext via useTerminal hook
- [ ] Add scan indicator component (shows when other terminals scanning)
- [ ] Add mirror mode toggle (Ctrl+M)
- [ ] Remove local EventSource (use context version)

**Files to modify:**
- `frontend/components/InteractiveTerminal.tsx`

### Phase 4: Sync Power State (30 mins)
- [ ] Add isPoweredOn to context
- [ ] First terminal to power on sets global state
- [ ] Other terminals skip boot sequence if already powered on

**Files to modify:**
- `frontend/context/TerminalContext.tsx`
- `frontend/components/InteractiveTerminal.tsx`

### Phase 5: Connect CommandWidget (1 hour)
- [ ] Wire CommandWidget to TerminalContext
- [ ] Add status display (scanning, powered on, audio)
- [ ] Add global control commands
- [ ] Test controlling terminals from Command Center

**Files to modify:**
- `frontend/components/widgets/CommandWidget.tsx`

### Phase 6: Update Arcade/Vault Terminals (1 hour)
- [ ] Refactor arcade terminal to use InteractiveTerminal with mode="minimal"
- [ ] Refactor vault terminal to use InteractiveTerminal with mode="minimal"
- [ ] Add scan indicators
- [ ] Remove duplicate code

**Files to modify:**
- `frontend/app/arcade/page.tsx`
- `frontend/app/vault/page.tsx`

### Phase 7: Polish & Testing (30 mins)
- [ ] Add keyboard shortcut (Ctrl+M for mirror mode)
- [ ] Add visual polish to scan indicators
- [ ] Test all flows across pages
- [ ] Test cleanup on navigation

---

## Technical Details

### TerminalContext State
```typescript
interface TerminalContextState {
  isPoweredOn: boolean
  isScanning: boolean
  scanProgress: number
  scanSource: string | null
  scanItems: TrendingItem[]
  audioEnabled: boolean
  eventSourceRef: EventSource | null
  globalOutput: TerminalLine[] // For mirror mode
}
```

### Cleanup Logic (Critical Fix)
```typescript
const cleanup = () => {
  // Close EventSource
  if (eventSourceRef) {
    eventSourceRef.close()
    setEventSourceRef(null)
  }

  // Stop all sounds
  Object.values(sounds).forEach(sound => {
    sound?.pause()
    sound.currentTime = 0
  })

  setIsScanning(false)
}
```

---

## User Experience Examples

### Example 1: Cross-Page Scanning
1. Start scan on Home page
2. Navigate to Arcade while scanning
3. ✅ Audio stops immediately
4. ✅ Arcade shows: "⚡ SCANNING: Home Terminal - 62%"
5. Can still type arcade commands OR press Ctrl+M to mirror

### Example 2: Power Sync
1. Home terminal boots up (2.2s)
2. Navigate to Command Center
3. ✅ Terminal already on (no boot sequence)
4. All terminals stay powered on

### Example 3: Command Widget Control
1. In Command Center workspace
2. Type in CommandWidget: `scan --github`
3. ✅ Scan starts, visible in TerminalWidget
4. ✅ Indicator updates in CommandWidget

---

## Benefits

✅ Fixes audio bug (EventSource cleanup)
✅ Professional multi-terminal feel
✅ Single source of truth for scan state
✅ Command Widget becomes control center
✅ No code duplication
✅ Better UX - see what's happening anywhere

---

## Open Questions

1. **Mirror vs Indicator:** Full mirror or just status? (Going with indicator + optional mirror)
2. **Scan rename:** Keep `scan` or rename to `source`/`trace`/`probe`?
3. **Auto-mirror:** Should terminals auto-mirror or manual?
4. **Boot sequence:** Once globally or per terminal?

---

## Effort Estimate

**Total: ~6 hours**
- Context setup: 2 hours
- Bug fixes: 30 mins
- InteractiveTerminal updates: 1 hour
- Power sync: 30 mins
- CommandWidget: 1 hour
- Arcade/Vault refactor: 1 hour
- Polish/testing: 30 mins

**Priority:** Medium-High (fixes real bug + great UX improvement)

---

## Files to Create
- `frontend/context/TerminalContext.tsx`
- `frontend/hooks/useTerminal.ts`

## Files to Modify
- `frontend/app/layout.tsx`
- `frontend/components/InteractiveTerminal.tsx`
- `frontend/components/widgets/CommandWidget.tsx`
- `frontend/app/arcade/page.tsx`
- `frontend/app/vault/page.tsx`

---

**Ready to implement when you are!** 🚀
