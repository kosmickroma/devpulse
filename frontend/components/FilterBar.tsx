'use client'

import { useState, useEffect } from 'react'

interface FilterBarProps {
  onSourcesChange: (sources: string[]) => void
}

const AVAILABLE_SOURCES = [
  { id: 'github', label: 'GITHUB', color: 'cyan' },
  { id: 'hackernews', label: 'HACKER NEWS', color: 'magenta' },
  { id: 'devto', label: 'DEV.TO', color: 'green' },
  { id: 'reddit', label: 'REDDIT', color: 'blue' },
  { id: 'stocks', label: 'STOCKS', color: 'pink' },
  { id: 'crypto', label: 'CRYPTO', color: 'purple' },
  { id: 'ign', label: 'IGN', color: 'orange' },
  { id: 'pcgamer', label: 'PC GAMER', color: 'purple' },
]

const STORAGE_KEY = 'devpulse-sources'

export default function FilterBar({ onSourcesChange }: FilterBarProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSelectedSources(parsed)
        onSourcesChange(parsed)
      } catch (e) {
        // If parsing fails, default to all sources
        const allSources = AVAILABLE_SOURCES.map(s => s.id)
        setSelectedSources(allSources)
        onSourcesChange(allSources)
      }
    } else {
      // Default: all sources selected
      const allSources = AVAILABLE_SOURCES.map(s => s.id)
      setSelectedSources(allSources)
      onSourcesChange(allSources)
    }
  }, [])

  const toggleSource = (sourceId: string) => {
    const newSources = selectedSources.includes(sourceId)
      ? selectedSources.filter(id => id !== sourceId)
      : [...selectedSources, sourceId]

    // Don't allow deselecting all sources
    if (newSources.length === 0) return

    setSelectedSources(newSources)
    onSourcesChange(newSources)

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSources))
  }

  const selectAll = () => {
    const allSources = AVAILABLE_SOURCES.map(s => s.id)
    setSelectedSources(allSources)
    onSourcesChange(allSources)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSources))
  }

  return (
    <div className="py-6">
      {/* Active Sources Display */}
      <div className="flex flex-wrap gap-3 justify-center items-center mb-4">
        <span className="text-gray-400 font-mono text-sm">&gt; ACTIVE SOURCES:</span>
        {selectedSources.map(sourceId => {
          const source = AVAILABLE_SOURCES.find(s => s.id === sourceId)
          if (!source) return null

          const colorClasses = {
            cyan: 'border-neon-cyan text-neon-cyan shadow-neon-cyan',
            magenta: 'border-neon-magenta text-neon-magenta shadow-neon-magenta',
            green: 'border-neon-green text-neon-green shadow-neon-green',
            blue: 'border-neon-blue text-neon-blue shadow-neon-blue',
            pink: 'border-neon-pink text-neon-pink shadow-neon-pink',
            purple: 'border-neon-purple text-neon-purple shadow-neon-purple',
            orange: 'border-neon-orange text-neon-orange shadow-neon-orange',
          }

          return (
            <span
              key={sourceId}
              className={`
                px-3 py-1 border-2 rounded font-mono text-xs font-bold
                ${colorClasses[source.color as keyof typeof colorClasses]}
                animate-glow-pulse
              `}
            >
              {source.label}
            </span>
          )
        })}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            px-3 py-1 border border-neon-cyan/50 rounded
            text-neon-cyan/70 font-mono text-xs
            hover:bg-neon-cyan/10 hover:border-neon-cyan
            transition-all
          "
        >
          {isExpanded ? '[ HIDE ]' : '[ EDIT ]'}
        </button>
      </div>

      {/* Source Selection Panel */}
      {isExpanded && (
        <div className="
          max-w-2xl mx-auto
          border-2 border-neon-cyan/30
          rounded-lg p-6
          bg-dark-card/50 backdrop-blur-sm
        ">
          <div className="text-center mb-4">
            <h3 className="text-neon-cyan font-mono text-lg font-bold mb-1">
              SELECT SOURCES
            </h3>
            <p className="text-gray-400 text-xs font-mono">
              Choose which platforms to scan for trending content
            </p>
          </div>

          <div className="space-y-3">
            {AVAILABLE_SOURCES.map(source => {
              const isSelected = selectedSources.includes(source.id)
              const colorClasses = {
                cyan: 'border-neon-cyan text-neon-cyan shadow-neon-cyan',
                magenta: 'border-neon-magenta text-neon-magenta shadow-neon-magenta',
                green: 'border-neon-green text-neon-green shadow-neon-green',
                blue: 'border-neon-blue text-neon-blue shadow-neon-blue',
                pink: 'border-neon-pink text-neon-pink shadow-neon-pink',
                purple: 'border-neon-purple text-neon-purple shadow-neon-purple',
                orange: 'border-neon-orange text-neon-orange shadow-neon-orange',
              }

              return (
                <label
                  key={source.id}
                  className="
                    flex items-center gap-4 p-4
                    border-2 rounded-lg
                    cursor-pointer
                    transition-all
                    hover:bg-dark-hover/50
                    ${isSelected
                      ? colorClasses[source.color as keyof typeof colorClasses]
                      : 'border-dark-border text-gray-400'
                    }
                  "
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSource(source.id)}
                    className="
                      w-5 h-5
                      accent-neon-cyan
                      cursor-pointer
                    "
                  />
                  <span className="font-mono text-sm font-bold flex-1">
                    {source.label}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-mono opacity-60">✓ ACTIVE</span>
                  )}
                </label>
              )
            })}
          </div>

          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={selectAll}
              className="
                px-4 py-2 border-2 border-neon-cyan rounded
                text-neon-cyan font-mono text-sm font-bold
                hover:bg-neon-cyan/10
                transition-all
              "
            >
              SELECT ALL
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="
                px-4 py-2 border-2 border-neon-magenta rounded
                text-neon-magenta font-mono text-sm font-bold
                hover:bg-neon-magenta/10
                transition-all
              "
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
