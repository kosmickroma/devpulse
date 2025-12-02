/**
 * Database helper functions for Supabase
 *
 * All functions are safe and non-breaking - if they fail, app continues working.
 */

import { supabase } from './supabase'
import { TrendingItem } from './types'

/**
 * Save scan results to database (optional - fails gracefully)
 */
export async function saveScanResults(items: TrendingItem[]): Promise<boolean> {
  try {
    console.log(`[DB] Attempting to save ${items.length} scan results...`)

    // Map TrendingItem to database format
    const dbItems = items.map(item => ({
      source: item.source,
      title: item.title,
      url: item.url,
      description: item.description || null,
      author: item.author || null,
      stars: item.stars || null,
      language: item.language || null,
      tags: [], // Future: add tags support to TrendingItem
      scan_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    }))

    console.log(`[DB] Sample item being saved:`, dbItems[0])

    const { error } = await supabase
      .from('scan_results')
      .upsert(dbItems, {
        onConflict: 'url,scan_date',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('[DB] ❌ Failed to save scan results:', error.message, error)
      return false
    }

    console.log(`[DB] ✅ Successfully saved ${items.length} scan results to database`)
    return true
  } catch (err) {
    console.error('[DB] ❌ Exception while saving scan results:', err)
    return false
  }
}

/**
 * Load cached scan results from today (optional - fails gracefully)
 */
export async function loadTodaysScanResults(): Promise<TrendingItem[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    console.log(`[DB] Attempting to load cached results for ${today}...`)

    const { data, error } = await supabase
      .from('scan_results')
      .select('*')
      .eq('scan_date', today)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[DB] ❌ Failed to load cached results:', error.message, error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('[DB] ℹ️ No cached results found for today')
      return []
    }

    console.log(`[DB] ✅ Found ${data.length} cached results, mapping to TrendingItem format...`)

    // Map database format back to TrendingItem
    const items: TrendingItem[] = data.map(row => ({
      id: row.id,
      source: row.source,
      title: row.title,
      url: row.url,
      description: row.description || '',
      author: row.author || '',
      stars: row.stars || 0,
      language: row.language || '',
      category: 'repository' as const, // Default category
      scrapedAt: new Date(row.created_at)
    }))

    console.log(`[DB] ✅ Successfully loaded ${items.length} cached scan results from database`)
    console.log(`[DB] Sample cached item:`, items[0])
    return items
  } catch (err) {
    console.error('[DB] ❌ Exception while loading cached results:', err)
    return []
  }
}

/**
 * Load cached results with fallback priority:
 * 1. Today's scan_results (freshest)
 * 2. cached_demo_items from backfill (always available)
 * 3. Empty array (triggers auto-scan)
 */
export async function loadCachedResults(): Promise<TrendingItem[]> {
  try {
    console.log('[DB] Loading cached results with fallback strategy...')

    // Priority 1: Check scan_results from today
    const todayResults = await loadTodaysScanResults()
    if (todayResults.length > 0) {
      console.log(`[DB] ✅ Using today's scan results: ${todayResults.length} items`)
      return todayResults
    }

    // Priority 2: Fall back to cached_demo_items (backfill)
    console.log('[DB] No scan results today, checking backfill cache...')
    const demoCache = await loadDemoCacheItems()
    if (demoCache.length > 0) {
      console.log(`[DB] ✅ Using backfill cache: ${demoCache.length} items`)
      return demoCache
    }

    // Priority 3: No cached data available
    console.log('[DB] ℹ️ No cached data available, will trigger auto-scan')
    return []
  } catch (err) {
    console.error('[DB] ❌ Exception in loadCachedResults:', err)
    return []
  }
}

/**
 * Load items from cached_demo_items (backfill cache)
 */
async function loadDemoCacheItems(): Promise<TrendingItem[]> {
  try {
    const { data, error} = await supabase
      .from('cached_demo_items')
      .select('*')
      .order('rank', { ascending: true })
      .limit(840) // 60 items × 14 sources

    if (error) {
      console.error('[DB] ❌ Failed to load demo cache:', error.message)
      return []
    }

    if (!data || data.length === 0) {
      console.log('[DB] ℹ️ No demo cache items found')
      return []
    }

    // Map cached_demo_items format to TrendingItem
    const items: TrendingItem[] = data.map(row => {
      const itemData = row.item_data as any
      return {
        id: itemData.id || row.id,
        source: row.source,
        title: itemData.title,
        url: itemData.url,
        description: itemData.description || '',
        author: itemData.author || '',
        stars: itemData.stars || 0,
        language: itemData.language || '',
        category: itemData.category || 'repository',
        scrapedAt: new Date(row.scraped_at || row.created_at)
      }
    })

    console.log(`[DB] ✅ Loaded ${items.length} items from demo cache`)
    return items
  } catch (err) {
    console.error('[DB] ❌ Exception loading demo cache:', err)
    return []
  }
}

/**
 * Load user preferences (optional - returns defaults on failure)
 */
export async function loadUserPreferences() {
  try {
    console.log('[DB] Loading user preferences...')
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[DB] ℹ️ No user logged in, returning defaults')
      return {
        selectedSources: ['github', 'hackernews', 'devto', 'reddit', 'stocks', 'crypto'],
        synthPersonality: 'default',
        autoScanEnabled: true,
        audioEnabled: false
      }
    }

    console.log('[DB] User ID:', user.id)

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      console.log('[DB] ℹ️ No preferences found for user, returning defaults. Error:', error?.message)
      // Return defaults
      return {
        selectedSources: ['github', 'hackernews', 'devto', 'reddit', 'stocks', 'crypto'],
        synthPersonality: 'default',
        autoScanEnabled: true,
        audioEnabled: false
      }
    }

    console.log('[DB] ✅ Loaded user preferences from database:', data)

    return {
      selectedSources: data.selected_sources || ['github', 'hackernews', 'devto', 'reddit', 'stocks', 'crypto'],
      synthPersonality: data.synth_personality || 'default',
      autoScanEnabled: data.auto_scan_enabled ?? true,
      audioEnabled: data.audio_enabled ?? false
    }
  } catch (err) {
    console.warn('[DB] ❌ Exception loading user preferences:', err)
    return {
      selectedSources: ['github', 'hackernews', 'devto', 'reddit', 'stocks', 'crypto'],
      synthPersonality: 'default',
      autoScanEnabled: true,
      audioEnabled: false
    }
  }
}

/**
 * Save user preferences (optional - fails gracefully)
 */
export async function saveUserPreferences(prefs: {
  selectedSources?: string[]
  synthPersonality?: string
  autoScanEnabled?: boolean
  audioEnabled?: boolean
}): Promise<boolean> {
  try {
    console.log('[DB] Saving user preferences:', prefs)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[DB] ❌ Cannot save preferences: user not logged in')
      return false
    }

    console.log('[DB] User ID:', user.id)

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        selected_sources: prefs.selectedSources,
        synth_personality: prefs.synthPersonality,
        auto_scan_enabled: prefs.autoScanEnabled,
        audio_enabled: prefs.audioEnabled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (error) {
      console.error('[DB] ❌ Failed to save user preferences:', error.message, error)
      return false
    }

    console.log('[DB] ✅ Saved user preferences to database:', data)
    return true
  } catch (err) {
    console.error('[DB] ❌ Exception saving user preferences:', err)
    return false
  }
}
