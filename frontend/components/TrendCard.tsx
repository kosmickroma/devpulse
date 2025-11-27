'use client'

import { useState } from 'react'
import { TrendingItem } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange',
    text: 'text-neon-orange',
    shadow: 'shadow-neon-orange',
    icon: '👽',
  },
  stocks: {
    bg: 'bg-neon-blue/10',
    border: 'border-neon-blue',
    text: 'text-neon-blue',
    shadow: 'shadow-neon-blue',
    icon: '📈',
  },
  crypto: {
    bg: 'bg-neon-purple/10',
    border: 'border-neon-purple',
    text: 'text-neon-purple',
    shadow: 'shadow-neon-purple',
    icon: '₿',
  },
  synth: {
    bg: 'bg-gradient-to-br from-neon-magenta/10 to-neon-cyan/10',
    border: 'border-neon-magenta',
    text: 'text-neon-magenta',
    shadow: 'shadow-neon-magenta',
    icon: '🤖',
  },
  ign: {
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400',
    text: 'text-yellow-400',
    shadow: 'shadow-neon-yellow',
    icon: '🎮',
  },
  pcgamer: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-500',
    shadow: 'shadow-neon-gaming-purple',
    icon: '🖥️',
  },
  bbc: {
    bg: 'bg-[#C11224]/10',
    border: 'border-[#C11224]',
    text: 'text-[#C11224]',
    shadow: 'shadow-neon-crimson',
    icon: '📰',
  },
  deutschewelle: {
    bg: 'bg-[#0A3F78]/10',
    border: 'border-[#0A3F78]',
    text: 'text-[#0A3F78]',
    shadow: 'shadow-neon-transmitter-blue',
    icon: '📰',
  },
  thehindu: {
    bg: 'bg-[#2A3C67]/10',
    border: 'border-[#2A3C67]',
    text: 'text-[#2A3C67]',
    shadow: 'shadow-neon-indigo-chronicle',
    icon: '📰',
  },
  africanews: {
    bg: 'bg-[#C6FF00]/10',
    border: 'border-[#C6FF00]',
    text: 'text-[#C6FF00]',
    shadow: 'shadow-neon-lime',
    icon: '📰',
  },
  bangkokpost: {
    bg: 'bg-[#1A4E8A]/10',
    border: 'border-[#1A4E8A]',
    text: 'text-[#1A4E8A]',
    shadow: 'shadow-neon-bangkok-blue',
    icon: '📰',
  },
  rt: {
    bg: 'bg-[#6CCF00]/10',
    border: 'border-[#6CCF00]',
    text: 'text-[#6CCF00]',
    shadow: 'shadow-neon-signal-green',
    icon: '📰',
  },
}

export default function TrendCard({ trend, index }: TrendCardProps) {
  // Extract base source (handle 'reddit/programming' format)
  const baseSource = trend.source.split('/')[0] as keyof typeof sourceColors
  const colors = sourceColors[baseSource] || sourceColors.github // Fallback to github colors
  const momentum = trend.momentum || 'low'
  const momentumColors = {
    high: 'text-neon-magenta',
    medium: 'text-neon-cyan',
    low: 'text-neon-green',
  }

  // SYNTH AI state
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleSummarize = async () => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSummaryError('Please sign in to use SYNTH AI')
      return
    }

    setLoadingSummary(true)
    setSummaryError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          url: trend.url,
          title: trend.title,
          content: trend.description || trend.title
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
      setRemaining(data.remaining)
    } catch (err: any) {
      setSummaryError(err.message)
    } finally {
      setLoadingSummary(false)
    }
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

        {/* SYNTH AI Summary Button */}
        {!summary && (
          <button
            onClick={handleSummarize}
            disabled={loadingSummary}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded
                     border-2 border-neon-cyan/30 text-neon-cyan text-xs font-mono
                     hover:border-neon-cyan hover:bg-neon-cyan/10
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300"
          >
            🤖 {loadingSummary ? 'SYNTH thinking...' : 'AI Summary'}
          </button>
        )}

        {/* Summary Display */}
        {summary && (
          <div className="mt-3 p-3 bg-dark-hover/50 border-2 border-neon-cyan/30 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-neon-cyan text-xs font-mono font-bold">🤖 SYNTH</span>
              {remaining !== null && (
                <span className="text-xs text-gray-500 font-mono">({remaining} left today)</span>
              )}
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{summary}</p>
            <button
              onClick={() => setSummary(null)}
              className="mt-2 text-xs text-gray-500 hover:text-neon-cyan transition-colors"
            >
              Hide
            </button>
          </div>
        )}

        {/* Error Display */}
        {summaryError && (
          <div className="mt-3 p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
            <p className="text-xs text-neon-magenta font-mono">⚠️ {summaryError}</p>
          </div>
        )}
      </div>

      {/* Glow Effect on Hover */}
      <div className={`absolute inset-0 ${colors.shadow} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`} />
    </div>
  )
}
