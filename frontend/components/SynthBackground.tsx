'use client'

import { useEffect, useState } from 'react'

export default function SynthBackground() {
  const [glitchOffset, setGlitchOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchOffset(Math.random() * 4 - 2)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden opacity-15 pointer-events-none">
      {/* Cybernetic Eye - Terminator Style */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '600px',
          height: '600px',
          transform: `translate(-50%, -50%) translate(${glitchOffset}px, ${glitchOffset}px)`,
        }}
      >
        {/* Outer Ring - Targeting System */}
        <svg viewBox="0 0 200 200" className="w-full h-full animate-spin-slow">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="0.5"
            strokeDasharray="5 5"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="0.3"
            strokeDasharray="10 5"
          />
          <circle
            cx="100"
            cy="100"
            r="50"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="0.3"
          />

          {/* Crosshairs */}
          <line x1="100" y1="10" x2="100" y2="40" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
          <line x1="100" y1="160" x2="100" y2="190" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
          <line x1="10" y1="100" x2="40" y2="100" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
          <line x1="160" y1="100" x2="190" y2="100" stroke="#00ffff" strokeWidth="1" opacity="0.6" />

          {/* Corner Brackets - RoboCop HUD */}
          <path d="M 20 20 L 20 40 M 20 20 L 40 20" stroke="#ff00ff" strokeWidth="2" opacity="0.8" />
          <path d="M 180 20 L 180 40 M 180 20 L 160 20" stroke="#ff00ff" strokeWidth="2" opacity="0.8" />
          <path d="M 20 180 L 20 160 M 20 180 L 40 180" stroke="#ff00ff" strokeWidth="2" opacity="0.8" />
          <path d="M 180 180 L 180 160 M 180 180 L 160 180" stroke="#ff00ff" strokeWidth="2" opacity="0.8" />

          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ff00ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Eye - Red like Terminator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-32 h-32 rounded-full relative"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #ff0000, #990000)',
              boxShadow: `
                0 0 40px rgba(255, 0, 0, 0.8),
                0 0 80px rgba(255, 0, 0, 0.4),
                inset 0 0 40px rgba(255, 0, 0, 0.6)
              `,
            }}
          >
            {/* Pupil */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black"
              style={{
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.9), inset 0 0 10px rgba(255, 0, 0, 0.5)'
              }}
            />

            {/* Scanning Line */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `linear-gradient(180deg,
                  transparent 0%,
                  transparent 30%,
                  rgba(255, 0, 0, 0.8) 50%,
                  transparent 70%,
                  transparent 100%
                )`,
                animation: 'scan-vertical 2s linear infinite'
              }}
            />
          </div>
        </div>
      </div>

      {/* Binary Code Rain - Matrix/Cyborg Style */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-neon-cyan font-mono text-xs"
            style={{
              left: `${i * 5}%`,
              top: '-20px',
              animation: `matrix-fall ${3 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.3,
            }}
          >
            {Array.from({ length: 15 }, () =>
              Math.random() > 0.5 ? '1' : '0'
            ).join('\n')}
          </div>
        ))}
      </div>

      {/* Glitch Text - "SYNTH ONLINE" */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-4xl font-bold">
        <div
          className="relative"
          style={{
            color: '#00ffff',
            textShadow: `
              -2px 0 #ff00ff,
              2px 0 #00ff00,
              0 0 20px #00ffff
            `,
            animation: 'glitch-text 5s infinite'
          }}
        >
          SYNTH ONLINE
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes scan-vertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes matrix-fall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes glitch-text {
          0%, 90%, 100% {
            transform: translate(0);
            filter: brightness(1);
          }
          92% {
            transform: translate(-2px, 2px);
            filter: brightness(1.5);
          }
          94% {
            transform: translate(2px, -2px);
            filter: brightness(0.8);
          }
          96% {
            transform: translate(-1px, 1px);
            filter: brightness(1.2);
          }
        }
      `}</style>
    </div>
  )
}
