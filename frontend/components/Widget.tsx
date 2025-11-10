'use client'

import { useState } from 'react'

export interface WidgetProps {
  id: string
  title: string
  children: React.ReactNode
  onRemove?: () => void
  onSettings?: () => void
  onFullscreen?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export default function Widget({
  id,
  title,
  children,
  onRemove,
  onSettings,
  onFullscreen,
  onRefresh,
  isRefreshing = false,
  className = ''
}: WidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`h-full flex flex-col border-2 border-neon-cyan/30 rounded-lg bg-dark-card overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neon-cyan/30 bg-dark-card/80">
        <h3 className="text-neon-cyan font-mono text-sm font-bold uppercase">
          {title}
        </h3>

        {/* Widget Controls */}
        <div className={`flex items-center gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-neon-green hover:text-neon-green/80 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <span className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
            </button>
          )}

          {onSettings && (
            <button
              onClick={onSettings}
              className="text-gray-400 hover:text-neon-cyan transition-colors"
              title="Settings"
            >
              <span className="text-lg">⚙️</span>
            </button>
          )}

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="text-gray-400 hover:text-neon-magenta transition-colors"
              title="Fullscreen"
            >
              <span className="text-lg">⛶</span>
            </button>
          )}

          {onRemove && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <span className="text-lg">❌</span>
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  )
}
