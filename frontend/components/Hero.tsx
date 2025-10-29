'use client'

import { useEffect, useState } from 'react'

const terminalLines = [
  '> Initializing DevPulse...',
  '> Connecting to data streams...',
  '> GitHub: [ONLINE]',
  '> Hacker News: [ONLINE]',
  '> Dev.to: [ONLINE]',
  '> Aggregating trends...',
  '> System ready. Welcome to the future.',
]

export default function Hero() {
  const [lines, setLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)

  useEffect(() => {
    if (currentLine < terminalLines.length) {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, terminalLines[currentLine]])
        setCurrentLine(prev => prev + 1)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentLine])

  return (
    <div className="relative overflow-hidden border-b-2 border-neon-cyan/30">
      {/* Perspective Grid Background */}
      <div className="absolute inset-0 perspective-grid opacity-20" style={{ height: '400px' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center mb-8">
          {/* DevPulse Animated Logo - The scanline inside animates! */}
          <div className="mb-6 flex justify-center">
            <img
              src="/devpulse_logo.svg"
              alt="DevPulse - Track the Pulse of Developer Trends"
              className="w-full max-w-3xl h-auto"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(255, 0, 255, 0.4)) drop-shadow(0 0 50px rgba(0, 255, 255, 0.3))',
              }}
            />
          </div>
          <p className="text-xl md:text-2xl text-neon-green neon-text-green font-mono animate-pulse">
            &gt; TRACK THE PULSE OF DEVELOPER TRENDS
          </p>
        </div>

        {/* Terminal Window */}
        <div className="max-w-3xl mx-auto neon-border rounded-lg overflow-hidden bg-dark-card/80 backdrop-blur">
          {/* Terminal Header */}
          <div className="bg-dark-hover border-b border-neon-cyan/30 px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neon-magenta shadow-neon-magenta" />
            <div className="w-3 h-3 rounded-full bg-neon-green shadow-neon-green" />
            <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-neon-cyan" />
            <span className="ml-4 text-neon-cyan font-mono text-sm">terminal://devpulse</span>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono text-sm md:text-base">
            {lines.map((line, index) => (
              <div
                key={index}
                className="mb-2 text-neon-green"
                style={{
                  animation: 'fadeIn 0.3s ease-in',
                }}
              >
                {line}
              </div>
            ))}
            {currentLine < terminalLines.length && (
              <div className="inline-block w-2 h-5 bg-neon-cyan animate-pulse" />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 neon-border rounded-lg bg-dark-card/50 backdrop-blur hover:bg-dark-hover transition-all duration-300">
            <div className="text-4xl font-black text-neon-cyan neon-text">3+</div>
            <div className="text-sm text-gray-400 mt-2 font-mono">DATA SOURCES</div>
          </div>
          <div className="text-center p-6 neon-border rounded-lg bg-dark-card/50 backdrop-blur hover:bg-dark-hover transition-all duration-300">
            <div className="text-4xl font-black text-neon-magenta neon-text-magenta">REAL-TIME</div>
            <div className="text-sm text-gray-400 mt-2 font-mono">UPDATES</div>
          </div>
          <div className="text-center p-6 neon-border rounded-lg bg-dark-card/50 backdrop-blur hover:bg-dark-hover transition-all duration-300">
            <div className="text-4xl font-black text-neon-green neon-text-green">AI</div>
            <div className="text-sm text-gray-400 mt-2 font-mono">POWERED INSIGHTS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
