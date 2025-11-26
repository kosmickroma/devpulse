# SYNTH IntentClassifier Activation - Session 2 Handoff

## Current Status: ⚠️ PARTIALLY WORKING - NEEDS FIXES

**Branch**: `main`
**Last Commits**:
- `db1c5dd` - feat: Activate IntentClassifier for professional query routing
- `cc2813c` - fix: Resolve cache method error in search_with_intent
- `f6279e7` - fix: Lower IntentClassifier confidence threshold to 0.4

**What's Deployed**: All changes are committed but NOT pushed to GitHub (git push failed due to credentials)

---

## What We Accomplished

### ✅ Completed Work:

1. **Fixed SourceType.OTHER Crash**
   - `api/services/sources/crypto_source.py`: Changed `SourceType.OTHER` → `SourceType.MARKET`
   - `api/services/sources/stocks_source.py`: Changed `SourceType.OTHER` → `SourceType.MARKET`

2. **Activated IntentClassifier Routing**
   - `api/services/conversation_service.py`: Removed shadow mode
   - Now actively routes based on confidence >= 0.4
   - Added `_handle_search_with_intent()` method

3. **Added search_with_intent() Method**
   - `api/services/synth_search_service_v2.py`: New 173-line method
   - Uses IntentClassifier keywords, entities, sources
   - Fixed cache integration (was calling non-existent methods)

4. **Fixed Time-Aware Sorting**
   - Time-sensitive queries sort by date first, then score
   - Regular queries sort by score only

5. **Added Financial Search Indicators**
   - Added `price`, `value`, `market`, `trading`, `ticker`, `chart` to search indicators

---

## Critical Issues Found During Testing

### 🔴 **ISSUE 1: Crypto API F-String Bug**

**File**: `api/services/sources/crypto_source.py`
**Location**: Lines with f-string price formatting
**Error**: `Invalid format specifier '.6f if price < 1 else .2f' for object of type 'int'`

**What's Happening**:
The code is trying to use conditional formatting in f-strings, which doesn't work in Python.

**Bad Code Pattern** (find this):
```python
f"${price:.6f if price < 1 else .2f}"  # ❌ INVALID SYNTAX
```

**Should Be**:
```python
f"${price:.6f}" if price < 1 else f"${price:.2f}"
```

**Test Query**: "bitcoin price today"
- ✅ IntentClassifier detects it (confidence 0.90, sources: ['crypto'])
- ❌ Crypto API crashes with f-string error
- Result: Returns 0 results with "Came up empty" message

**Files to Check**:
- Search for `f".*:.6f if.*else.*:.2f` pattern in `crypto_source.py`
- Likely in `_sync_search()` method around lines 200-290
- Check both specific coin search AND trending coins search

---

### 🔴 **ISSUE 2: IntentClassifier Returns ALL Sources (No Filtering)**

**File**: `api/services/intent_classifier.py`
**Location**: `_determine_sources()` method (lines 452-507)

**What's Happening**:
The IntentClassifier is supposed to intelligently select 2-3 sources, but it's returning **all 6 sources** for most queries.

**Test Evidence**:
```
Query: "python tutorials"
Expected Sources: ['github', 'devto']
Actual Sources: ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']
Result: Still searches 6 sources (same as before)

Query: "rust frameworks"
Expected Sources: ['github', 'devto']
Actual Sources: ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']
Result: Still searches 6 sources

Query: "latest tech news"
Expected Sources: ['hackernews', 'reddit', 'devto']
Actual Sources: ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']
Result: Returns mostly crypto coins instead of news!
```

**Root Cause**:
Look at `intent_classifier.py` lines 452-507. The `_determine_sources()` method has this logic:

```python
# If low confidence or no sources → search ALL
if not sources or confidence < 0.5:
    sources = ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']
```

**The Problem**:
1. If NO explicit source mentioned ("on github"), it defaults to all sources
2. The intent-based routing (lines 470-500) only adds sources, never filters

**What Should Happen**:
```python
# Tutorial intent → GitHub + Dev.to ONLY
if detected_intent == IntentType.TUTORIAL:
    sources = ['github', 'devto']

# News intent → HN + Reddit + Dev.to ONLY
elif detected_intent == IntentType.NEWS:
    sources = ['hackernews', 'reddit', 'devto']

# Code search → GitHub + Dev.to ONLY
elif detected_intent == IntentType.CODE_SEARCH:
    sources = ['github', 'devto']

# Only use all sources if truly ambiguous (confidence < 0.3)
```

**Current Behavior** (lines 495-500):
```python
# If low confidence or no sources → search ALL
if not sources or confidence < 0.5:
    sources = ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']
```

This means:
- ✅ "bitcoin price" (explicit crypto) → works
- ❌ "python tutorials" (no explicit source) → all 6 sources
- ❌ "rust frameworks" (no explicit source) → all 6 sources
- ❌ "latest tech news" (no explicit source) → all 6 sources

---

## Test Results Summary

| Query | Confidence | Intent | Sources Returned | Expected Sources | Status |
|-------|-----------|---------|-----------------|------------------|--------|
| "bitcoin price today" | 0.90 | price_check | ['crypto'] | ['crypto'] | ❌ Crashes (f-string bug) |
| "python tutorials" | 0.50 | tutorial | ALL 6 | ['github', 'devto'] | ❌ No filtering |
| "rust frameworks" | 0.45 | code_search | ALL 6 | ['github', 'devto'] | ❌ No filtering |
| "latest tech news" | 0.45 | news | ALL 6 | ['hackernews', 'reddit', 'devto'] | ❌ No filtering |

**Performance Impact**:
- Expected: 60% reduction in API calls (6 → 2-3)
- Actual: 0% reduction (still searching all 6 sources)
- Expected: 60% faster responses
- Actual: No improvement

---

## Exact Fixes Needed

### FIX 1: Crypto F-String Bug

**File**: `api/services/sources/crypto_source.py`

**Step 1**: Search for the bad pattern
```bash
grep -n "\.6f if.*else.*\.2f" api/services/sources/crypto_source.py
```

**Step 2**: Replace conditional f-strings
Find lines like:
```python
f"${price:.6f if price < 1 else .2f}"
```

Replace with:
```python
f"${price:.6f}" if price < 1 else f"${price:.2f}"
```

**Where to Look**:
- `_sync_search()` method (lines 230-310)
- Any line formatting price_usd, current_price, or similar
- Check BOTH specific coin search AND trending coins

**Test After Fix**:
```
Query: "bitcoin price today"
Expected: Returns 15 crypto prices from CoinGecko
```

---

### FIX 2: Intent-Based Source Filtering

**File**: `api/services/intent_classifier.py`
**Method**: `_determine_sources()` (lines 452-507)

**Current Logic** (WRONG):
```python
def _determine_sources(...):
    # Add sources based on intent
    if detected_intent == IntentType.TUTORIAL:
        sources.extend(['devto', 'github'])  # ← EXTENDS, doesn't replace

    # Fallback to all sources if empty
    if not sources or confidence < 0.5:
        sources = ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']
```

**Fixed Logic** (RIGHT):
```python
def _determine_sources(...):
    # If explicit sources mentioned, use those
    if detected_sources:
        sources = list(detected_sources)

    # Otherwise, route based on intent (NO extending, REPLACE)
    elif detected_intent == IntentType.TUTORIAL:
        sources = ['github', 'devto']  # ← Only these 2

    elif detected_intent == IntentType.CODE_SEARCH:
        sources = ['github', 'devto']

    elif detected_intent == IntentType.DISCUSSION:
        sources = ['reddit', 'hackernews']

    elif detected_intent == IntentType.NEWS:
        sources = ['hackernews', 'reddit', 'devto']

    elif detected_intent == IntentType.PRICE_CHECK:
        sources = ['crypto', 'stocks']

    elif detected_intent == IntentType.DOCUMENTATION:
        sources = ['github', 'devto']

    # Only use all sources if truly ambiguous (low confidence)
    elif confidence < 0.3:
        sources = ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']

    # Default to code-focused sources
    else:
        sources = ['github', 'devto', 'hackernews']

    # Add crypto/stocks if entities detected
    if 'cryptocurrencies' in entities and 'crypto' not in sources:
        sources.insert(0, 'crypto')  # Prioritize crypto
    if 'stocks' in entities and 'stocks' not in sources:
        sources.insert(0, 'stocks')

    return sources
```

**Key Changes**:
1. **REPLACE instead of EXTEND**: `sources = [...]` not `sources.extend([...])`
2. **Remove the "if not sources" fallback**: This was causing all queries to get all sources
3. **Lower the fallback threshold**: Only use all sources if confidence < 0.3 (not < 0.5)
4. **Entity-based additions**: Add crypto/stocks if detected in entities

**Test After Fix**:
```
Query: "python tutorials"
Expected Sources: ['github', 'devto']
Expected Result: 15 GitHub repos + 0 Dev.to articles = relevant tutorials

Query: "rust frameworks"
Expected Sources: ['github', 'devto']
Expected Result: 15 Rust frameworks only

Query: "latest tech news"
Expected Sources: ['hackernews', 'reddit', 'devto']
Expected Result: Recent HN stories + Reddit posts (no crypto coins!)
```

---

## Files Modified (Uncommitted Changes)

None currently - all changes are committed locally but NOT pushed.

**To Push**:
```bash
git push origin main
```

Then redeploy on Render.

---

## Testing Checklist

After fixes, test these queries on devpulse.app:

### Priority 1: Crash Fixes
- [ ] **"bitcoin price today"** - Should return 15 crypto prices (not crash)
- [ ] **"ethereum value"** - Should work (tests f-string fix in multiple places)

### Priority 2: Source Filtering
- [ ] **"python tutorials"** - Should show ONLY GitHub repos (no Reddit, no crypto)
- [ ] **"rust frameworks"** - Should show ONLY GitHub repos (no Reddit, no crypto)
- [ ] **"latest tech news"** - Should show HN/Reddit posts (NO crypto coins)

### Priority 3: Verify Smart Routing Still Works
- [ ] **"AI research papers"** - Should use fallback (confidence 0.30)
- [ ] **"rust web frameworks"** - Should return perfect results (already worked)

---

## Backend Log Patterns to Check

**Good Signs** (after fixes):
```
🎯 IntentClassifier Results:
   Confidence: 0.50
   Intent: tutorial
   Sources: ['github', 'devto']  ← Only 2 sources!
   Keywords: ['python', 'tutorials']

🎯 Smart search with intent:
   Sources: ['github', 'devto']  ← Confirmed 2 sources

🔍 github query: 'python tutorials' (limit=15, filters={'language': 'python'})
🔍 devto query: 'python tutorials' (limit=15, filters={})

✅ github: Found 15 results
✅ devto: Found 15 results
⭐ Sorted by score
```

**Bad Signs** (current behavior):
```
Sources: ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto']  ← 6 sources!

🔍 github query: 'python tutorials' ...
🔍 reddit query: 'python tutorials' ...
🔍 hackernews query: 'python tutorials' ...
🔍 devto query: 'python tutorials' ...
🔍 stocks query: 'python tutorials' ...  ← WHY?!
🔍 crypto query: 'python tutorials' ...  ← WHY?!
```

---

## Expected Results After Fixes

### Query: "bitcoin price today"
**Before**: Crashes with f-string error, returns 0 results
**After**: Returns 15 crypto prices from CoinGecko
```
📈 BTC - Bitcoin
by CoinGecko
$42,156.32 (+2.45%) | Rank: #1

📈 ETH - Ethereum
by CoinGecko
$2,234.56 (+1.82%) | Rank: #2
...
```

### Query: "python tutorials"
**Before**: Searches 6 sources, returns random results (AI challenges, memes)
**After**: Searches 2 sources, returns 15 Python tutorials
```
🤖 SYNTH/GITHUB
stanford-tensorflow-tutorials
●
Python
▲ 10375

🤖 SYNTH/GITHUB
machine_learning_examples
●
Python
▲ 8748
...
```

### Query: "latest tech news"
**Before**: Searches 6 sources, returns crypto coins
**After**: Searches 3 sources, returns recent tech news
```
🤖 SYNTH/HACKERNEWS
Show HN: I built a tech news aggregator
▲ 188
💬 97

🤖 SYNTH/REDDIT
New AI breakthrough announced today
▲ 543
💬 127
...
```

---

## Performance Metrics (After Fixes)

| Metric | Current | Expected After Fixes | Target |
|--------|---------|---------------------|--------|
| API calls per query | 6 | 2-3 | 2-3 ✅ |
| Sources searched (tutorial) | 6 | 2 | 2 ✅ |
| Sources searched (news) | 6 | 3 | 3 ✅ |
| Crypto queries working | ❌ Crash | ✅ Working | ✅ |
| Result relevance | 33% | 80%+ | 80%+ ✅ |

---

## Code Locations Reference

### Files to Modify:
1. **`api/services/sources/crypto_source.py`**
   - Lines 200-310: Fix f-string formatting
   - Search for: `.6f if.*else.*:.2f`

2. **`api/services/intent_classifier.py`**
   - Lines 452-507: `_determine_sources()` method
   - Change `sources.extend([...])` to `sources = [...]`
   - Remove `if not sources or confidence < 0.5` fallback
   - Add intent-based routing

### Files Already Modified (Committed):
- `api/services/sources/crypto_source.py` - SourceType.MARKET fix
- `api/services/sources/stocks_source.py` - SourceType.MARKET fix
- `api/services/conversation_service.py` - IntentClassifier activation
- `api/services/synth_search_service_v2.py` - search_with_intent() method

---

## Git Status

```bash
$ git status
On branch main
Your branch is ahead of 'origin/main' by 3 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
```

**Commits Ready to Push**:
- `db1c5dd` - feat: Activate IntentClassifier for professional query routing
- `cc2813c` - fix: Resolve cache method error in search_with_intent
- `f6279e7` - fix: Lower IntentClassifier confidence threshold to 0.4

---

## Next Session Prompt (Copy/Paste This)

```
I'm continuing work on activating the IntentClassifier for SYNTH AI search.

CONTEXT:
- IntentClassifier is active but has 2 critical bugs preventing it from working
- All previous work is committed locally but NOT pushed to GitHub
- Please read HANDOFF_2025-11-25_SESSION2.md for full context

IMMEDIATE ISSUES TO FIX:

1. CRYPTO API F-STRING BUG (file: api/services/sources/crypto_source.py)
   - Search for pattern: `.6f if.*else.*:.2f` in f-strings
   - Replace with proper conditional: f"${price:.6f}" if price < 1 else f"${price:.2f}"
   - This fixes "bitcoin price today" crash

2. INTENT-BASED SOURCE FILTERING (file: api/services/intent_classifier.py, lines 452-507)
   - The _determine_sources() method returns ALL 6 sources instead of filtering
   - Change sources.extend([...]) to sources = [...] (REPLACE not EXTEND)
   - Remove the "if not sources or confidence < 0.5" fallback
   - Add proper intent-based routing:
     - TUTORIAL → ['github', 'devto']
     - CODE_SEARCH → ['github', 'devto']
     - NEWS → ['hackernews', 'reddit', 'devto']
     - PRICE_CHECK → ['crypto', 'stocks']
     - DISCUSSION → ['reddit', 'hackernews']

TESTING AFTER FIXES:
- "bitcoin price today" - Should return 15 crypto prices (not crash)
- "python tutorials" - Should search ONLY github + devto (not all 6 sources)
- "rust frameworks" - Should search ONLY github + devto
- "latest tech news" - Should search ONLY hackernews + reddit + devto

Please:
1. Read the handoff document
2. Fix both issues
3. Test locally if possible
4. Commit with professional message
5. Push to GitHub so I can redeploy

The goal is 60% reduction in API calls (6 sources → 2-3 sources per query).
```

---

## Additional Notes

- **Shadow mode is OFF**: IntentClassifier is now actively routing queries
- **Confidence threshold is 0.4**: Queries with confidence >= 0.4 use IntentClassifier
- **Fallback exists**: Low confidence queries (< 0.4) use old system
- **Cache is working**: Uses same cache service as regular search
- **Time sorting works**: Time-sensitive queries sort by date first

**The only things broken are**:
1. Crypto API f-string bug (syntax error)
2. Source filtering returns all 6 sources (logic error)

Both are straightforward fixes. Once done, the system will work as designed:
- Fast (0.03ms classification)
- Smart (2-3 sources instead of 6)
- Reliable (fallback for ambiguous queries)

---

**End of Handoff**

Session complete. All context captured. Ready for next developer.
