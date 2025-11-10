# DevPulse Database Setup

## Running Migrations

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the contents of each migration file in order:
   - `001_scan_results.sql`
   - `002_user_preferences.sql`
5. Click **Run** for each migration

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## What These Tables Do

### `scan_results`
- **Purpose**: Caches trending items from scans
- **Benefits**:
  - Faster page loads (loads cached results instantly)
  - Reduces API calls to GitHub/HN/Dev.to
  - Shows results even if APIs are down
  - Tracks trending history over time

### `user_preferences`
- **Purpose**: Stores user settings and preferences
- **Benefits**:
  - Remembers source selections across sessions
  - Future: SYNTH personality selection
  - Future: Custom scan schedules
  - Auto-scan on/off preference
  - Audio on/off preference

## Safety

All database operations are **optional and non-breaking**:
- If database fails, app continues working normally
- All functions have graceful fallbacks
- Console warnings show what's happening (not errors)

## Testing

After running migrations, the app will:
1. Auto-save scan results to database
2. Load cached results on page load (if available)
3. Save source selections to user preferences (if logged in)

Check browser console for confirmation messages like:
- `✅ Saved 45 scan results to database`
- `✅ Loaded 45 cached scan results from database`
- `✅ Saved user preferences to database`
