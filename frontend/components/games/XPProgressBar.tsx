'use client'

import { useState, useEffect } from 'react'

interface XPProgressBarProps {
  currentXP: number
  currentLevel: number
  onLevelUp?: (newLevel: number) => void
}

export default function XPProgressBar({ currentXP, currentLevel, onLevelUp }: XPProgressBarProps) {
  const [displayXP, setDisplayXP] = useState(currentXP)
  const [displayLevel, setDisplayLevel] = useState(currentLevel)
  const [isLevelingUp, setIsLevelingUp] = useState(false)

  // XP formula: 1500 XP per level
  const xpPerLevel = 1500
  const currentLevelXP = (currentLevel - 1) * xpPerLevel
  const nextLevelXP = currentLevel * xpPerLevel
  const xpIntoLevel = currentXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  const progressPercent = Math.min((xpIntoLevel / xpNeededForLevel) * 100, 100)

  // Smooth XP animation
  useEffect(() => {
    if (displayXP < currentXP) {
      const diff = currentXP - displayXP
      const increment = Math.ceil(diff / 10)
      const timer = setTimeout(() => {
        setDisplayXP(prev => Math.min(prev + increment, currentXP))
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [displayXP, currentXP])

  // Level up detection and animation
  useEffect(() => {
    if (currentLevel > displayLevel) {
      // Level up!
      setIsLevelingUp(true)

      // Play level up animation
      setTimeout(() => {
        setDisplayLevel(currentLevel)
        onLevelUp?.(currentLevel)

        // End animation
        setTimeout(() => {
          setIsLevelingUp(false)
        }, 500)
      }, 300)
    }
  }, [currentLevel, displayLevel, onLevelUp])

  return (
    <div className="w-full max-w-2xl">
      <div className={`relative transition-all duration-500 ${isLevelingUp ? 'scale-110' : 'scale-100'}`}>
        {/* Level Display */}
        <div className="flex items-center justify-between mb-2">
          <div className={`text-2xl font-mono font-bold text-cyan-400 transition-all duration-300 ${
            isLevelingUp ? 'animate-pulse text-yellow-400 scale-125' : ''
          }`}>
            LEVEL {displayLevel}
          </div>
          <div className="text-sm font-mono text-gray-400">
            {xpIntoLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-10 bg-gradient-to-r from-gray-900 to-black border-2 border-cyan-500 rounded-lg overflow-hidden">
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,255,255,0.1) 10px, rgba(0,255,255,0.1) 11px)',
            }}
          />

          {/* Progress Fill */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out shimmer"
            style={{
              width: `${progressPercent}%`,
              boxShadow: '0 0 20px rgba(0,255,255,0.6), inset 0 0 10px rgba(255,255,255,0.3)',
            }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          </div>

          {/* Level Up Flash Overlay */}
          {isLevelingUp && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 animate-levelUpFlash" />
          )}

          {/* Progress Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-bold text-sm text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)] z-10">
              {Math.round(progressPercent)}%
            </span>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 20px rgba(0,255,255,0.3)',
            }}
          />
        </div>

        {/* Level Up Particles */}
        {isLevelingUp && (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-4xl font-mono font-bold text-yellow-400 animate-levelUpText">
              LEVEL UP!
            </div>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-particle"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-30px)`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Total XP Display */}
      <div className="mt-2 text-center">
        <span className="text-xs font-mono text-gray-500">
          Total XP: {displayXP.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
