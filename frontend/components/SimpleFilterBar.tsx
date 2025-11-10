'use client'

import { useState, useEffect } from 'react'

interface SimpleFilterBarProps {
  onSourcesChange: (sources: string[]) => void
  initialSources?: string[]
}

const AVAILABLE_SOURCES = [
  { id: 'github', label: 'GITHUB', color: 'cyan' },
  { id: 'hackernews', label: 'HACKER NEWS', color: 'magenta' },
  { id: 'devto', label: 'DEV.TO', color: 'green' },
]

export default function SimpleFilterBar({ onSourcesChange, initialSources }: SimpleFilterBarProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  // Initialize with user preferences or all sources
  useEffect(() => {
    const sources = initialSources && initialSources.length > 0
      ? initialSources
      : AVAILABLE_SOURCES.map(s => s.id)
    setSelectedSources(sources)
    onSourcesChange(sources)
  }, [initialSources])

  const toggleSource = (sourceId: string) => {
    const newSources = selectedSources.includes(sourceId)
      ? selectedSources.filter(id => id !== sourceId)
      : [...selectedSources, sourceId]

    // Don't allow deselecting all sources
    if (newSources.length === 0) return

    setSelectedSources(newSources)
    onSourcesChange(newSources)
  }

  const colorClasses = {
    cyan: {
      active: 'border-neon-cyan text-neon-cyan shadow-neon-cyan bg-neon-cyan/10',
      inactive: 'border-neon-cyan/30 text-neon-cyan/40 hover:border-neon-cyan/50 hover:text-neon-cyan/60'
    },
    magenta: {
      active: 'border-neon-magenta text-neon-magenta shadow-neon-magenta bg-neon-magenta/10',
      inactive: 'border-neon-magenta/30 text-neon-magenta/40 hover:border-neon-magenta/50 hover:text-neon-magenta/60'
    },
    green: {
      active: 'border-neon-green text-neon-green shadow-neon-green bg-neon-green/10',
      inactive: 'border-neon-green/30 text-neon-green/40 hover:border-neon-green/50 hover:text-neon-green/60'
    },
  }

  return (
    <div className="py-6">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <span className="text-gray-400 font-mono text-sm">&gt; FILTER:</span>
        {AVAILABLE_SOURCES.map(source => {
          const isSelected = selectedSources.includes(source.id)
          const classes = colorClasses[source.color as keyof typeof colorClasses]

          return (
            <button
              key={source.id}
              onClick={() => toggleSource(source.id)}
              className={`
                px-4 py-2 border-2 rounded font-mono text-xs font-bold
                transition-all cursor-pointer
                ${isSelected ? classes.active : classes.inactive}
              `}
            >
              {source.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
