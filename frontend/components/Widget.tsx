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
      className={`h-full flex flex-col border-2 rounded-lg bg-dark-card overflow-hidden transition-all duration-300 ${
        isHovered
          ? 'border-neon-cyan shadow-neon-cyan'
          : 'border-neon-cyan/30'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Widget Header - Draggable (Minimal) */}
      <div className="widget-drag-handle flex items-center gap-2 px-3 py-1 cursor-move hover:bg-neon-cyan/5 transition-all">
        <span className="text-neon-cyan/30 text-xs">⋮⋮</span>
        <h3 className="text-neon-cyan/60 font-mono text-xs uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  )
}
