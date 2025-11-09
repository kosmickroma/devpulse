'use client'

import { useState, useEffect } from 'react'

interface SynthAvatarProps {
  isThinking?: boolean
  mode?: 'idle' | 'scanning' | 'alert' | 'friendly'
  size?: 'sm' | 'md' | 'lg'
}

export default function SynthAvatar({
  isThinking = false,
  mode = 'idle',
  size = 'md'
}: SynthAvatarProps) {
  const [scanLine, setScanLine] = useState(0)
  const [pulse, setPulse] = useState(0)

  // Scanning animation (like Terminator's eye)
  useEffect(() => {
    if (isThinking || mode === 'scanning') {
      const interval = setInterval(() => {
        setScanLine(prev => (prev + 1) % 100)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isThinking, mode])

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 100)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  const getColors = () => {
    if (isThinking || mode === 'scanning') {
      return {
        primary: '#ff0000', // Terminator red
        secondary: '#ff6600',
        glow: 'rgba(255, 0, 0, 0.8)'
      }
    }
    if (mode === 'alert') {
      return {
        primary: '#ff00ff', // Warning magenta
        secondary: '#ff0000',
        glow: 'rgba(255, 0, 255, 0.8)'
      }
    }
    // Friendly mode (default)
    return {
      primary: '#00ffff', // Friendly cyan
      secondary: '#00ff88',
      glow: 'rgba(0, 255, 255, 0.8)'
    }
  }

  const colors = getColors()

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer Hexagon - Angular/Robotic */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}11)`,
          border: `2px solid ${colors.primary}`,
          boxShadow: `
            0 0 10px ${colors.glow},
            0 0 20px ${colors.glow},
            inset 0 0 10px ${colors.glow}
          `,
          animation: isThinking ? 'synth-hexagon-pulse 1s ease-in-out infinite' : 'none'
        }}
      />

      {/* Corner Accents - RoboCop HUD style */}
      <div className="absolute inset-1">
        {/* Top Left */}
        <div
          className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors duration-300"
          style={{ borderColor: colors.primary }}
        />
        {/* Top Right */}
        <div
          className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors duration-300"
          style={{ borderColor: colors.primary }}
        />
        {/* Bottom Left */}
        <div
          className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors duration-300"
          style={{ borderColor: colors.primary }}
        />
        {/* Bottom Right */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors duration-300"
          style={{ borderColor: colors.primary }}
        />
      </div>

      {/* Inner Circle - The "Eye" */}
      <div
        className="relative z-10 w-8 h-8 rounded-full transition-all duration-300"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.primary}, ${colors.secondary}44)`,
          boxShadow: `
            0 0 15px ${colors.glow},
            inset 0 0 10px ${colors.glow}
          `,
          transform: isThinking ? `scale(${1 + Math.sin(pulse * 0.1) * 0.1})` : 'scale(1)'
        }}
      >
        {/* Scanning Line - Terminator style */}
        {(isThinking || mode === 'scanning') && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(180deg,
                transparent ${scanLine}%,
                ${colors.primary} ${scanLine}%,
                ${colors.primary} ${scanLine + 5}%,
                transparent ${scanLine + 5}%
              )`
            }}
          />
        )}

        {/* Center Dot - The "Pupil" */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{
            background: colors.primary,
            boxShadow: `0 0 10px ${colors.glow}`,
            animation: isThinking ? 'synth-pupil-pulse 0.5s ease-in-out infinite' : 'none'
          }}
        />
      </div>

      {/* Rotating Ring - Like a targeting reticle */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          animation: isThinking ? 'synth-ring-rotate 2s linear infinite' : 'none'
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Partial circle arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={colors.primary}
            strokeWidth="1"
            strokeDasharray="20 80"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Targeting marks */}
          <line x1="50" y1="5" x2="50" y2="15" stroke={colors.primary} strokeWidth="2" />
          <line x1="95" y1="50" x2="85" y2="50" stroke={colors.primary} strokeWidth="2" />
          <line x1="50" y1="95" x2="50" y2="85" stroke={colors.primary} strokeWidth="2" />
          <line x1="5" y1="50" x2="15" y2="50" stroke={colors.primary} strokeWidth="2" />
        </svg>
      </div>

      {/* Status Indicators - Small dots like RoboCop's display */}
      {!isThinking && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: colors.primary,
              boxShadow: `0 0 4px ${colors.glow}`
            }}
          />
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: colors.secondary,
              boxShadow: `0 0 4px ${colors.glow}`
            }}
          />
        </div>
      )}

      {/* Alert Triangle (only in alert mode) */}
      {mode === 'alert' && (
        <div className="absolute -top-2 -right-2 animate-pulse">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M6 1 L11 10 L1 10 Z"
              fill="none"
              stroke="#ff0000"
              strokeWidth="1"
            />
            <text x="6" y="8" fontSize="6" fill="#ff0000" textAnchor="middle">!</text>
          </svg>
        </div>
      )}
    </div>
  )
}
