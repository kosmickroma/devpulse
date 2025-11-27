'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { loadUserPreferences, saveUserPreferences } from '@/lib/db'

const AVAILABLE_SOURCES = [
  { id: 'github', label: 'GitHub', icon: '💻', description: 'Trending repositories and code' },
  { id: 'hackernews', label: 'Hacker News', icon: '🔶', description: 'Tech news and discussions' },
  { id: 'devto', label: 'Dev.to', icon: '✍️', description: 'Developer articles and tutorials' },
  { id: 'reddit', label: 'Reddit', icon: '🤖', description: 'Discussions and posts from subreddits' },
  { id: 'stocks', label: 'Stocks', icon: '📈', description: 'Trending stocks and market movers' },
  { id: 'crypto', label: 'Crypto', icon: '₿', description: 'Trending cryptocurrencies' },
  { id: 'ign', label: 'IGN', icon: '🎮', description: 'Gaming news and reviews' },
  { id: 'pcgamer', label: 'PC Gamer', icon: '🖥️', description: 'PC gaming news and reviews' },
  { id: 'bbc', label: 'BBC News', icon: '📰', description: 'World and UK news from BBC' },
  { id: 'deutschewelle', label: 'Deutsche Welle', icon: '📰', description: 'International news from Germany' },
  { id: 'thehindu', label: 'The Hindu', icon: '📰', description: 'National news from India' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>(['github', 'hackernews', 'devto', 'reddit', 'stocks', 'crypto', 'ign', 'pcgamer', 'bbc', 'deutschewelle', 'thehindu'])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/')
      return
    }

    setUser(user)

    // Load user preferences
    const prefs = await loadUserPreferences()
    setSelectedSources(prefs.selectedSources)
    setLoading(false)
  }

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => {
      if (prev.includes(sourceId)) {
        // Don't allow deselecting all sources
        if (prev.length === 1) return prev
        return prev.filter(id => id !== sourceId)
      } else {
        return [...prev, sourceId]
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    console.log('[SETTINGS] Saving preferences:', selectedSources)

    const success = await saveUserPreferences({
      selectedSources
    })

    setSaving(false)
    if (success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      console.log('[SETTINGS] ✅ Preferences saved successfully')
    } else {
      setSaveError('Failed to save preferences. Check console for details.')
      console.error('[SETTINGS] ❌ Failed to save preferences')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-neon-cyan font-mono">Loading settings...</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-cyan mb-2">⚙️ Settings</h1>
          <p className="text-gray-400 font-mono">Customize your DevPulse experience</p>
        </div>

        {/* Content Sources */}
        <div className="border-2 border-neon-cyan/30 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-neon-green mb-4">📡 Content Sources</h2>
          <p className="text-gray-400 text-sm mb-6">
            Choose which platforms you want to see in your feed. Changes apply to scans and cached results.
          </p>

          <div className="space-y-4">
            {AVAILABLE_SOURCES.map(source => {
              const isSelected = selectedSources.includes(source.id)

              return (
                <div
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-neon-cyan'
                      : 'border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{source.icon}</span>
                      <div>
                        <h3 className={`font-bold ${isSelected ? 'text-neon-cyan' : 'text-gray-300'}`}>
                          {source.label}
                        </h3>
                        <p className="text-sm text-gray-400">{source.description}</p>
                      </div>
                    </div>
                    <div className={`
                      w-6 h-6 rounded border-2 flex items-center justify-center
                      ${isSelected ? 'border-neon-cyan bg-neon-cyan' : 'border-gray-500'}
                    `}>
                      {isSelected && <span className="text-black font-bold">✓</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-neon-cyan text-black font-bold rounded hover:bg-neon-cyan/80 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>

            {saveSuccess && (
              <span className="text-neon-green font-mono">✓ Saved successfully!</span>
            )}

            {saveError && (
              <span className="text-neon-magenta font-mono text-sm">✗ {saveError}</span>
            )}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="border-2 border-gray-600/30 rounded-lg p-6 opacity-50">
          <h2 className="text-2xl font-bold text-gray-500 mb-4">🔮 Coming Soon</h2>
          <ul className="space-y-2 text-gray-500 font-mono text-sm">
            <li>• More Gaming News (GameSpot, Polygon, Kotaku)</li>
            <li>• Space News (NASA, SpaceX)</li>
            <li>• Detailed Reddit Subreddit Configuration</li>
            <li>• SYNTH Personality Settings</li>
            <li>• Audio Effects Toggle</li>
            <li>• Custom Widget Dashboard</li>
          </ul>
        </div>
      </div>

      <Footer />
    </main>
  )
}
