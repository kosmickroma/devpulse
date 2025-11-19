'use client'

import { useEffect, useState } from 'react'
import TrendCard from '@/components/TrendCard'
import InteractiveTerminal from '@/components/InteractiveTerminal'
import SimpleFilterBar from '@/components/SimpleFilterBar'
import SynthFindsButton from '@/components/SynthFindsButton'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import OperatorProfileModal from '@/components/OperatorProfileModal'
import Footer from '@/components/Footer'
import { TrendingItem } from '@/lib/types'
import { loadTodaysScanResults } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [trends, setTrends] = useState<TrendingItem[]>([])
  const [filteredTrends, setFilteredTrends] = useState<TrendingItem[]>([])
  const [prioritySource, setPrioritySource] = useState<string | null>(null) // Source to show first
  const [preferenceSources, setPreferenceSources] = useState<string[]>([]) // Sources from user preferences
  const [manualSources, setManualSources] = useState<string[]>([]) // Sources scanned manually via terminal
  const [hasSynthResults, setHasSynthResults] = useState(false) // Track if SYNTH results exist
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Load user preferences and cached results on mount
  useEffect(() => {
    window.scrollTo(0, 0)

    // Check for auth errors in URL
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      setAuthError(decodeURIComponent(error))
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Load user preferences and set selected sources
    const loadPreferences = async () => {
      const { loadUserPreferences } = await import('@/lib/db')
      const prefs = await loadUserPreferences()
      console.log('[PAGE] Loaded user preferences:', prefs.selectedSources)
      setPreferenceSources(prefs.selectedSources)
    }
    loadPreferences()

    // Load cached results on mount (in addition to terminal auto-scan)
    console.log('[PAGE] Loading cached results on page mount...')
    loadTodaysScanResults().then(cachedItems => {
      if (cachedItems.length > 0) {
        console.log(`[PAGE] ✅ Loaded ${cachedItems.length} cached items on mount`)
        setTrends(cachedItems)
        setFilteredTrends(cachedItems)
        setIsFromCache(true)
        setLastUpdated(new Date())
      } else {
        console.log('[PAGE] No cached items found on mount')
      }
    })
  }, [])

  const handleDataReceived = (items: TrendingItem[]) => {
    console.log(`[PAGE] Received ${items.length} items from terminal`)

    // Track which sources were scanned (extract unique sources from items)
    const scannedSources = Array.from(new Set(items.map(item => item.source.split('/')[0])))
    console.log('[PAGE] Scanned sources:', scannedSources)

    // Check if any are SYNTH results
    const synthSources = scannedSources.filter(src => src === 'synth')
    if (synthSources.length > 0) {
      setHasSynthResults(true)
      console.log('[PAGE] 🤖 SYNTH results detected!')
    }

    // Add scanned sources to manual sources (if not already in preferences)
    setManualSources(prev => {
      const newManualSources = scannedSources.filter(src => !preferenceSources.includes(src) && src !== 'synth')
      const combined = Array.from(new Set([...prev, ...newManualSources]))
      console.log('[PAGE] Manual sources updated:', combined)
      return combined
    })

    // Merge new items with existing trends instead of replacing
    // This preserves data from other sources when scanning a specific source
    setTrends(prevTrends => {
      // Create a map of existing items by URL (for deduplication)
      const existingMap = new Map(prevTrends.map(item => [item.url, item]))

      // Track new items to put on top
      const newUrls = new Set(items.map(item => item.url))

      // Add or update items
      items.forEach(item => {
        existingMap.set(item.url, item)
      })

      // Convert to array and sort: new items first, then existing
      const allItems = Array.from(existingMap.values())
      return allItems.sort((a, b) => {
        const aIsNew = newUrls.has(a.url)
        const bIsNew = newUrls.has(b.url)
        if (aIsNew && !bIsNew) return -1
        if (!aIsNew && bIsNew) return 1
        return 0
      })
    })

    setFilteredTrends(prevFiltered => {
      const existingMap = new Map(prevFiltered.map(item => [item.url, item]))
      const newUrls = new Set(items.map(item => item.url))
      items.forEach(item => {
        existingMap.set(item.url, item)
      })
      const allItems = Array.from(existingMap.values())
      return allItems.sort((a, b) => {
        const aIsNew = newUrls.has(a.url)
        const bIsNew = newUrls.has(b.url)
        if (aIsNew && !bIsNew) return -1
        if (!aIsNew && bIsNew) return 1
        return 0
      })
    })

    setIsFromCache(false) // Fresh data, not from cache
    setLastUpdated(new Date())
  }

  const handleSourceSelect = (source: string | null) => {
    console.log('[PAGE] Priority source selected:', source)
    setPrioritySource(source)
  }

  const handleSynthFindsClick = () => {
    // Toggle SYNTH priority
    if (prioritySource === 'synth') {
      setPrioritySource(null) // Clear priority
    } else {
      setPrioritySource('synth') // Prioritize SYNTH results
    }
  }

  // Count SYNTH results
  const synthResultCount = trends.filter(t => t.source.startsWith('synth/')).length

  useEffect(() => {
    if (!prioritySource) {
      // No priority - show everything as-is
      setFilteredTrends(trends)
    } else {
      // Move priority source to the top, keep others at the bottom
      const priorityItems: TrendingItem[] = []
      const otherItems: TrendingItem[] = []

      trends.forEach(trend => {
        // Extract base source (handle 'reddit/programming' format)
        const baseSource = trend.source.split('/')[0]
        if (baseSource === prioritySource) {
          priorityItems.push(trend)
        } else {
          otherItems.push(trend)
        }
      })

      setFilteredTrends([...priorityItems, ...otherItems])
    }
  }, [prioritySource, trends])

  return (
    <main className="min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenProfile={() => setShowProfile(true)}
      />
      <OperatorProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Auth Error Display */}
      {authError && (
        <div className="container mx-auto px-4 pt-4">
          <div className="border-2 border-neon-magenta bg-neon-magenta/10 rounded p-4 text-center">
            <p className="text-neon-magenta font-mono text-sm">
              <strong>Authentication Error:</strong> {authError}
            </p>
            <button
              onClick={() => setAuthError(null)}
              className="mt-2 text-xs text-gray-400 hover:text-neon-cyan"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hero Section with Logo */}
      <div className="relative overflow-hidden border-b-2 border-neon-cyan/30 py-12">
        <div className="absolute inset-0 perspective-grid opacity-20" style={{ height: '300px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/devpulse_logo.svg"
              alt="DevPulse"
              className="w-full max-w-2xl h-auto"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(255, 0, 255, 0.4)) drop-shadow(0 0 50px rgba(0, 255, 255, 0.3))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Terminal */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <InteractiveTerminal
          onDataReceived={handleDataReceived}
          selectedSources={preferenceSources}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* SYNTH FINDS Button - Special placement above filters */}
        {hasSynthResults && (
          <SynthFindsButton
            onClick={handleSynthFindsClick}
            isActive={prioritySource === 'synth'}
            resultCount={synthResultCount}
          />
        )}

        <SimpleFilterBar
          onSourceSelect={handleSourceSelect}
          activeSources={[...preferenceSources, ...manualSources]}
          prioritySource={prioritySource === 'synth' ? null : prioritySource}
        />

        {/* Cache Status Indicator */}
        {isFromCache && lastUpdated && (
          <div className="text-center py-2 mb-4">
            <span className="text-xs text-neon-cyan/60 font-mono">
              📦 Showing cached results from today
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-neon-cyan font-mono">LOADING TRENDS...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredTrends.map((trend, index) => (
              <TrendCard key={trend.id} trend={trend} index={index} />
            ))}
          </div>
        )}

        {!isLoading && filteredTrends.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-neon-magenta font-mono">NO TRENDS FOUND</p>
            <p className="text-gray-400 mt-2">Try selecting a different source</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
