'use client'

import { useState, useEffect } from 'react'

interface SimpleFilterBarProps {
  onSourceSelect: (source: string | null) => void // Select a source to prioritize (null = no priority)
  activeSources?: string[] // Sources to show buttons for
  prioritySource?: string | null // Currently prioritized source
}

const ALL_SOURCES = [
  { id: 'github', label: 'GITHUB', color: 'cyan' },
  { id: 'hackernews', label: 'HACKER NEWS', color: 'magenta' },
  { id: 'devto', label: 'DEV.TO', color: 'green' },
  { id: 'reddit', label: 'REDDIT', color: 'orange' },
  { id: 'stocks', label: 'STOCKS', color: 'blue' },
  { id: 'crypto', label: 'CRYPTO', color: 'purple' },
  { id: 'ign', label: 'IGN', color: 'yellow' },
  { id: 'pcgamer', label: 'PC GAMER', color: 'gaming-purple' },
  { id: 'bbc', label: 'BBC NEWS', color: 'crimson' },
  { id: 'deutschewelle', label: 'DEUTSCHE WELLE', color: 'transmitter-blue' },
  { id: 'thehindu', label: 'THE HINDU', color: 'indigo-chronicle' },
]

export default function SimpleFilterBar({ onSourceSelect, activeSources, prioritySource }: SimpleFilterBarProps) {
  // Filter to only show sources that are active
  const sourcesToShow = activeSources && activeSources.length > 0
    ? ALL_SOURCES.filter(s => activeSources.includes(s.id))
    : ALL_SOURCES

  const handleSourceClick = (sourceId: string) => {
    // If clicking the already-prioritized source, clear the priority
    if (prioritySource === sourceId) {
      onSourceSelect(null)
    } else {
      // Otherwise, prioritize this source
      onSourceSelect(sourceId)
    }
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
    orange: {
      active: 'border-neon-orange text-neon-orange shadow-neon-orange bg-neon-orange/10',
      inactive: 'border-neon-orange/30 text-neon-orange/40 hover:border-neon-orange/50 hover:text-neon-orange/60'
    },
    blue: {
      active: 'border-neon-blue text-neon-blue shadow-neon-blue bg-neon-blue/10',
      inactive: 'border-neon-blue/30 text-neon-blue/40 hover:border-neon-blue/50 hover:text-neon-blue/60'
    },
    purple: {
      active: 'border-neon-purple text-neon-purple shadow-neon-purple bg-neon-purple/10',
      inactive: 'border-neon-purple/30 text-neon-purple/40 hover:border-neon-purple/50 hover:text-neon-purple/60'
    },
    yellow: {
      active: 'border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] bg-yellow-400/10',
      inactive: 'border-yellow-400/30 text-yellow-400/40 hover:border-yellow-400/50 hover:text-yellow-400/60'
    },
    'gaming-purple': {
      active: 'border-[#a855f7] text-[#a855f7] shadow-[0_0_10px_#a855f7] bg-[#a855f7]/10',
      inactive: 'border-[#a855f7]/30 text-[#a855f7]/40 hover:border-[#a855f7]/50 hover:text-[#a855f7]/60'
    },
    crimson: {
      active: 'border-[#C11224] text-[#C11224] shadow-[0_0_10px_rgba(193,18,36,0.5)] bg-[#C11224]/10',
      inactive: 'border-[#C11224]/30 text-[#C11224]/40 hover:border-[#C11224]/50 hover:text-[#C11224]/60'
    },
    'transmitter-blue': {
      active: 'border-[#0A3F78] text-[#0A3F78] shadow-[0_0_10px_rgba(10,63,120,0.5)] bg-[#0A3F78]/10',
      inactive: 'border-[#0A3F78]/30 text-[#0A3F78]/40 hover:border-[#0A3F78]/50 hover:text-[#0A3F78]/60'
    },
    'indigo-chronicle': {
      active: 'border-[#2A3C67] text-[#2A3C67] shadow-[0_0_10px_rgba(42,60,103,0.5)] bg-[#2A3C67]/10',
      inactive: 'border-[#2A3C67]/30 text-[#2A3C67]/40 hover:border-[#2A3C67]/50 hover:text-[#2A3C67]/60'
    },
  }

  return (
    <div className="py-6">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <span className="text-gray-400 font-mono text-sm">&gt; FILTER:</span>
        {sourcesToShow.map(source => {
          const isPriority = prioritySource === source.id
          const classes = colorClasses[source.color as keyof typeof colorClasses]

          return (
            <button
              key={source.id}
              onClick={() => handleSourceClick(source.id)}
              className={`
                px-4 py-2 border-2 rounded font-mono text-xs font-bold
                transition-all cursor-pointer
                ${isPriority ? classes.active : classes.inactive}
              `}
            >
              {source.label} {isPriority && '↑'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
