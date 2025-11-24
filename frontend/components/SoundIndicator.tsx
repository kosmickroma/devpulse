'use client'

import { useEffect, useState } from 'react'

interface SoundIndicatorProps {
  isVisible: boolean
  onDismiss: () => void
}

/**
 * Subtle indicator that appears when audio is locked
 * Lets users know they can tap for sound without being intrusive
 */
export default function SoundIndicator({ isVisible, onDismiss }: SoundIndicatorProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        onDismiss()
      }, 4000)
      return () => clearTimeout(timer)
    } else {
      // Delay unmount for fade-out animation
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onDismiss])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed bottom-24 left-8 z-[9998] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{ pointerEvents: 'none' }} // Don't block clicks
    >
      <div className="px-4 py-3 bg-dark-card/90 backdrop-blur-sm border-2 border-neon-cyan/50 rounded shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔊</div>
          <div className="font-mono text-sm">
            <div className="text-neon-cyan font-semibold">Tap anywhere for sound FX</div>
            <div className="text-gray-400 text-xs mt-0.5">Optional - demo works without it</div>
          </div>
        </div>
      </div>
    </div>
  )
}
