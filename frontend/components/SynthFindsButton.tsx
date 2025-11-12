'use client'

import { useState } from 'react'

interface SynthFindsButtonProps {
  onClick: () => void
  isActive: boolean
  resultCount?: number
}

export default function SynthFindsButton({ onClick, isActive, resultCount = 0 }: SynthFindsButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative flex justify-center mb-6">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative px-8 py-4 font-mono font-bold text-sm
          transition-all duration-300 cursor-pointer
          ${isActive
            ? 'synth-finds-active'
            : 'synth-finds-inactive'
          }
        `}
        style={{
          background: isActive
            ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 50%, #FF00FF 100%)'
            : 'linear-gradient(135deg, rgba(255,0,255,0.3) 0%, rgba(0,255,255,0.3) 50%, rgba(255,0,255,0.3) 100%)',
          backgroundSize: '200% 200%',
          animation: 'holographic-shift 3s ease infinite',
          border: '2px solid',
          borderImage: 'linear-gradient(135deg, #FF00FF, #00FFFF, #FF00FF) 1',
          boxShadow: isActive
            ? '0 0 30px rgba(255,0,255,0.8), 0 0 60px rgba(0,255,255,0.6), inset 0 0 20px rgba(255,255,255,0.2)'
            : '0 0 15px rgba(255,0,255,0.4), 0 0 30px rgba(0,255,255,0.3)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {/* Scanline overlay effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            opacity: isHovered ? 1 : 0.5,
          }}
        />

        {/* Animated border glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent, rgba(255,0,255,0.3), transparent)',
            animation: 'border-scan 2s linear infinite',
            opacity: isActive ? 1 : 0,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-2xl animate-pulse">🤖</span>
          <div className="flex flex-col items-start">
            <span
              className="text-white font-bold tracking-wider"
              style={{
                textShadow: isActive
                  ? '0 0 10px #FF00FF, 0 0 20px #00FFFF'
                  : '0 0 5px #FF00FF',
              }}
            >
              SYNTH FINDS
            </span>
            {resultCount > 0 && (
              <span className="text-xs text-white/80">
                {resultCount} results
              </span>
            )}
          </div>
          {isActive && <span className="text-xl">↑</span>}
        </div>

        {/* Particle effects when active */}
        {isActive && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="synth-particle-special"
                style={{
                  position: 'absolute',
                  left: `${20 + i * 15}%`,
                  bottom: '-5px',
                  width: '3px',
                  height: '3px',
                  background: i % 2 === 0 ? '#FF00FF' : '#00FFFF',
                  borderRadius: '50%',
                  opacity: 0.6,
                  animation: `float-up-special ${2 + Math.random()}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? '#FF00FF' : '#00FFFF'}`,
                }}
              />
            ))}
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes holographic-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes border-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes float-up-special {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-30px) scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-60px) scale(0.5);
            opacity: 0;
          }
        }

        .synth-finds-active {
          animation: synth-pulse 2s ease-in-out infinite;
        }

        @keyframes synth-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  )
}
