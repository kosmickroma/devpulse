'use client'

export default function SynthBackground() {

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
      {/* Main Container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">

        {/* Digital Skull - Wireframe Style */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {/* Magenta gradient */}
            <linearGradient id="skull-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ff00ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.8" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Skull Outline */}
          <ellipse cx="100" cy="90" rx="50" ry="60" fill="none" stroke="url(#skull-gradient)" strokeWidth="1.5" filter="url(#glow)" />

          {/* Top of skull - cranium */}
          <path d="M 60 70 Q 100 50, 140 70" fill="none" stroke="url(#skull-gradient)" strokeWidth="1.5" filter="url(#glow)" />
          <path d="M 65 80 Q 100 65, 135 80" fill="none" stroke="url(#skull-gradient)" strokeWidth="1" opacity="0.6" />

          {/* Eye Sockets - Hollow and menacing */}
          <ellipse cx="80" cy="95" rx="12" ry="15" fill="none" stroke="url(#skull-gradient)" strokeWidth="2" filter="url(#glow)" />
          <ellipse cx="120" cy="95" rx="12" ry="15" fill="none" stroke="url(#skull-gradient)" strokeWidth="2" filter="url(#glow)" />

          {/* Inner eye glow */}
          <circle cx="80" cy="95" r="6" fill="#ff00ff" opacity="0.4" />
          <circle cx="120" cy="95" r="6" fill="#ff00ff" opacity="0.4" />

          {/* Nose cavity - triangular */}
          <path d="M 100 110 L 95 125 L 105 125 Z" fill="none" stroke="url(#skull-gradient)" strokeWidth="1.5" filter="url(#glow)" />

          {/* Cheekbones */}
          <path d="M 60 105 Q 70 110, 80 110" fill="none" stroke="url(#skull-gradient)" strokeWidth="1" opacity="0.5" />
          <path d="M 140 105 Q 130 110, 120 110" fill="none" stroke="url(#skull-gradient)" strokeWidth="1" opacity="0.5" />

          {/* Jaw line */}
          <path d="M 65 130 Q 100 150, 135 130" fill="none" stroke="url(#skull-gradient)" strokeWidth="1.5" filter="url(#glow)" />

          {/* Teeth - segmented */}
          {[...Array(8)].map((_, i) => {
            const x = 70 + (i * 7.5)
            return (
              <line
                key={i}
                x1={x} y1="135"
                x2={x} y2="145"
                stroke="url(#skull-gradient)"
                strokeWidth="1.5"
                opacity="0.7"
                filter="url(#glow)"
              />
            )
          })}

          {/* Circuit patterns on skull */}
          <path d="M 75 75 L 85 75 L 85 85" fill="none" stroke="url(#skull-gradient)" strokeWidth="0.5" opacity="0.4" />
          <path d="M 125 75 L 115 75 L 115 85" fill="none" stroke="url(#skull-gradient)" strokeWidth="0.5" opacity="0.4" />
          <circle cx="85" cy="85" r="1.5" fill="#ff00ff" opacity="0.6" />
          <circle cx="115" cy="85" r="1.5" fill="#ff00ff" opacity="0.6" />

          {/* More circuit details */}
          <path d="M 60 95 L 50 95 L 50 105" fill="none" stroke="url(#skull-gradient)" strokeWidth="0.5" opacity="0.3" />
          <path d="M 140 95 L 150 95 L 150 105" fill="none" stroke="url(#skull-gradient)" strokeWidth="0.5" opacity="0.3" />

          {/* Crosshairs overlay */}
          <line x1="100" y1="50" x2="100" y2="60" stroke="#ff00ff" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="140" x2="100" y2="150" stroke="#ff00ff" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="100" x2="60" y2="100" stroke="#ff00ff" strokeWidth="1" opacity="0.5" />
          <line x1="140" y1="100" x2="150" y2="100" stroke="#ff00ff" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* Binary code rain in background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-neon-magenta font-mono text-xs leading-tight"
            style={{
              left: `${i * 6.66}%`,
              top: '-50px',
              animation: `binary-fall ${4 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            {Array.from({ length: 20 }, () => Math.random() > 0.5 ? '1' : '0').join('\n')}
          </div>
        ))}
      </div>

      {/* "SYNTH ONLINE" glitching text */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-3xl font-bold">
        <div
          style={{
            color: '#ff00ff',
            textShadow: `
              -1px 0 #00ffff,
              1px 0 #ff00ff,
              0 0 20px #ff00ff
            `,
            animation: 'text-glitch 6s infinite'
          }}
        >
          SYNTH ONLINE
        </div>
      </div>

      <style jsx>{`
        @keyframes binary-fall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes text-glitch {
          0%, 90%, 100% { transform: translate(0); filter: brightness(1); }
          91% { transform: translate(-3px, 2px); filter: brightness(1.5); }
          93% { transform: translate(3px, -2px); filter: brightness(0.7); }
          95% { transform: translate(-2px, 1px); filter: brightness(1.3); }
          97% { transform: translate(1px, -1px); filter: brightness(0.9); }
        }
      `}</style>
    </div>
  )
}
