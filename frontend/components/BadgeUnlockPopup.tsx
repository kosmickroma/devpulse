'use client'

import { useEffect, useState } from 'react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
}

interface BadgeUnlockPopupProps {
  badge: Badge | null
  onClose: () => void
}

export default function BadgeUnlockPopup({ badge, onClose }: BadgeUnlockPopupProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (badge) {
      setShow(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300) // Wait for fade out animation
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [badge, onClose])

  if (!badge || !show) return null

  // Get color based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'neon-magenta'
      case 'epic': return 'neon-purple'
      case 'rare': return 'neon-blue'
      case 'uncommon': return 'neon-cyan'
      case 'common': return 'neon-green'
      default: return 'neon-green'
    }
  }

  const color = getRarityColor(badge.rarity)
  const textColorClass = `text-${color}`
  const borderColorClass = `border-${color}`
  const shadowClass = `shadow-${color}`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => {
          setShow(false)
          setTimeout(onClose, 300)
        }}
      />

      {/* Badge Unlock Notification - Cyberpunk Flashing Neon Sign */}
      <div
        className={`
          fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          z-[10000]
          p-8
          border-4 ${borderColorClass}
          bg-dark-bg/90
          backdrop-blur-md
          rounded-lg
          ${shadowClass}
          animate-flicker
          w-96
          ${show ? 'animate-in zoom-in-95 fade-in duration-300' : 'animate-out zoom-out-95 fade-out duration-300'}
        `}
        style={{
          boxShadow: `0 0 60px var(--${color}), inset 0 0 40px rgba(57, 255, 20, 0.3)`,
          animation: 'neon-flicker 0.3s ease-in-out 6, glow-pulse 2s ease-in-out infinite 2s'
        }}
      >
        <div className="text-center space-y-4">
          {/* Achievement Header */}
          <div className={`${textColorClass} font-bold font-mono text-2xl tracking-wider drop-shadow-[0_0_10px_currentColor]`}>
            🎖️ BADGE UNLOCKED! 🎖️
          </div>

          {/* Badge Icon - HUGE */}
          <div className="text-8xl animate-bounce-slow my-6 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
            {badge.icon}
          </div>

          {/* Badge Name */}
          <div className={`${textColorClass} text-2xl font-mono font-bold tracking-wide drop-shadow-[0_0_8px_currentColor]`}>
            {badge.name}
          </div>

          {/* Rarity Tag */}
          <div className="flex justify-center">
            <span className={`px-4 py-1 ${borderColorClass} border-2 ${textColorClass} text-xs font-mono uppercase rounded-full tracking-widest`}>
              {badge.rarity}
            </span>
          </div>

          {/* Description */}
          <div className={`${textColorClass}/80 text-sm font-mono leading-relaxed px-4`}>
            {badge.description}
          </div>

          {/* Divider */}
          <div className={`border-t-2 ${borderColorClass}/50 my-4`} />

          {/* Instructions */}
          <div className={`${textColorClass}/70 text-xs font-mono space-y-1`}>
            <div className="animate-pulse">
              ⚙️ Go to PREFERENCES to equip this badge
            </div>
            <div className="text-gray-500 mt-2">
              Press ESC or click anywhere to close
            </div>
          </div>

          {/* Particle effects (optional sparkle) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-4 left-4 w-2 h-2 ${textColorClass} rounded-full animate-ping`} />
            <div className={`absolute top-4 right-4 w-2 h-2 ${textColorClass} rounded-full animate-ping animation-delay-150`} />
            <div className={`absolute bottom-4 left-4 w-2 h-2 ${textColorClass} rounded-full animate-ping animation-delay-300`} />
            <div className={`absolute bottom-4 right-4 w-2 h-2 ${textColorClass} rounded-full animate-ping animation-delay-450`} />
          </div>
        </div>
      </div>

      {/* Scanline effect overlay */}
      <div className="fixed inset-0 z-[9998] pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />
    </>
  )
}
