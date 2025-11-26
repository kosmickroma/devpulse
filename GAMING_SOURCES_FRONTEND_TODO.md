# Gaming Sources Frontend Integration TODO

## ✅ Backend Complete:
- IGN source implemented (GraphQL API)
- PC Gamer source implemented (BeautifulSoup scraping)
- Both registered in SourceRegistry
- IntentClassifier patterns added
- Dependencies added to requirements.txt

## 🎨 Frontend Tasks Remaining:

### 1. Add Filter Button Colors
Location: Look for where filter buttons are defined (likely CommandCenter or Terminal component)

**New Colors Needed:**
- **IGN**: `#D7212E` (IGN red) or use a unique orange/amber
- **PC Gamer**: `#FF6B00` (PC Gamer orange) or use a unique purple/violet

**Existing Colors to Avoid:**
- GitHub: Likely blue/purple
- Reddit: Orange
- HackerNews: Orange
- Dev.to: Likely purple
- Stocks: Green
- Crypto: Gold/yellow

**Recommended Unique Colors:**
- **IGN**: `#E91E63` (Hot Pink / Magenta) - gaming/vibrant
- **PC Gamer**: `#9C27B0` (Deep Purple) - premium/tech

### 2. Add Sources to Filter Buttons
Add these two entries to the filter buttons array:

```typescript
{
  name: 'ign',
  label: 'IGN',
  color: '#E91E63'  // Hot pink
},
{
  name: 'pcgamer',
  label: 'PC Gamer',
  color: '#9C27B0'  // Deep purple
}
```

### 3. Add to Operator Preferences
Location: Settings/Preferences component

Add toggles for:
- [ ] IGN (gaming news)
- [ ] PC Gamer (PC gaming news & reviews)

### 4. Update Auto-Scan Logic
Ensure gaming sources are included in auto-scan when enabled in preferences.

## 🧪 Testing Queries:

Once deployed, test:
```
gaming news
latest gaming news
IGN articles
PC Gamer reviews
best games 2024
```

Should route to IGN + PC Gamer sources automatically!

## 📁 Files to Modify:

Need to locate and modify:
1. **Filter buttons component** - Add IGN + PC Gamer with unique colors
2. **Operator preferences/settings** - Add IGN + PC Gamer toggles
3. **Auto-scan logic** - Include new sources if enabled

Let me know the file paths and I'll make the changes!
