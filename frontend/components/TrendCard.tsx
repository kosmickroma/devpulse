'use client'

import { TrendingItem } from '@/lib/types'

interface TrendCardProps {
  trend: TrendingItem
  index: number
}

const sourceColors = {
  github: {
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan',
    text: 'text-neon-cyan',
    shadow: 'shadow-neon-cyan',
    icon: '⚡',
  },
  hackernews: {
    bg: 'bg-neon-magenta/10',
    border: 'border-neon-magenta',
    text: 'text-neon-magenta',
    shadow: 'shadow-neon-magenta',
    icon: '▲',
  },
  devto: {
    bg: 'bg-neon-green/10',
    border: 'border-neon-green',
    text: 'text-neon-green',
    shadow: 'shadow-neon-green',
    icon: '💎',
  },
  producthunt: {
    bg: 'bg-neon-purple/10',
    border: 'border-neon-purple',
    text: 'text-neon-purple',
    shadow: 'shadow-neon-purple',
    icon: '🚀',
  },
  reddit: {
    bg: 'bg-neon-pink/10',
    border: 'border-neon-pink',
    text: 'text-neon-pink',
    shadow: 'shadow-neon-pink',
    icon: '👽',
  },
}

export default function TrendCard({ trend, index }: TrendCardProps) {
  const colors = sourceColors[trend.source]
  const momentum = trend.momentum || 'low'
  const momentumColors = {
    high: 'text-neon-magenta',
    medium: 'text-neon-cyan',
    low: 'text-neon-green',
  }

  return (
    <div
      className={`
        group relative overflow-hidden rounded-lg
        bg-dark-card border-2 ${colors.border}
        hover:${colors.shadow} hover:scale-105
        transition-all duration-300
        ${colors.bg}
      `}
      style={{
        animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className={`px-3 py-1 rounded border ${colors.border} ${colors.text} text-xs font-mono font-bold`}>
            {colors.icon} {trend.source.toUpperCase()}
          </div>
          {trend.isNew && (
            <div className="px-2 py-1 rounded bg-neon-magenta/20 border border-neon-magenta text-neon-magenta text-xs font-mono animate-pulse">
              NEW
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-2">
          {trend.title}
        </h3>
        {trend.author && (
          <p className="text-sm text-gray-400 font-mono mt-1">by {trend.author}</p>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {trend.description && (
          <p className="text-gray-300 text-sm mb-4 line-clamp-3">
            {trend.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-4 font-mono text-sm">
          {trend.language && (
            <div className="flex items-center gap-1 text-neon-cyan">
              <span className="text-xs">●</span> {trend.language}
            </div>
          )}
          {trend.stars != null && (
            <div className={`flex items-center gap-1 ${colors.text}`}>
              ⭐ {Number(trend.stars).toLocaleString()}
            </div>
          )}
          {trend.score != null && (
            <div className={`flex items-center gap-1 ${colors.text}`}>
              ▲ {trend.score}
            </div>
          )}
          {trend.reactions != null && (
            <div className={`flex items-center gap-1 ${colors.text}`}>
              ❤️ {trend.reactions}
            </div>
          )}
          {trend.comments != null && (
            <div className="flex items-center gap-1 text-gray-400">
              💬 {trend.comments}
            </div>
          )}
        </div>

        {/* Momentum Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400 font-mono">MOMENTUM:</span>
          <div className={`flex items-center gap-1 ${momentumColors[momentum]} font-mono text-sm font-bold`}>
            {momentum === 'high' && '🔥🔥🔥'}
            {momentum === 'medium' && '🔥🔥'}
            {momentum === 'low' && '🔥'}
            <span className="ml-1">{momentum.toUpperCase()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={trend.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex-1 py-2 px-4 rounded border-2 ${colors.border} ${colors.text}
              text-center font-mono text-sm font-bold
              hover:${colors.bg} hover:${colors.shadow}
              transition-all duration-300
            `}
          >
            VIEW →
          </a>
          <button
            className="px-4 py-2 rounded border-2 border-dark-border text-gray-400
                     hover:border-neon-cyan hover:text-neon-cyan
                     transition-all duration-300"
            title="Share"
          >
            📤
          </button>
          <button
            className="px-4 py-2 rounded border-2 border-dark-border text-gray-400
                     hover:border-neon-magenta hover:text-neon-magenta
                     transition-all duration-300"
            title="Save"
          >
            💾
          </button>
        </div>
      </div>

      {/* Glow Effect on Hover */}
      <div className={`absolute inset-0 ${colors.shadow} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`} />
    </div>
  )
}
