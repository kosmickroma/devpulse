'use client'

import { useAutoDemo } from '@/hooks/useAutoDemo'

interface AutoDemoControllerProps {
  isUserLoggedIn: boolean
  isHomepage: boolean
  terminalRef: React.RefObject<HTMLDivElement>
  onDemoStart: () => void
  onDemoComplete: () => void
  onDemoSkip: () => void
}

/**
 * Auto-Demo Controller Component
 * Shows skip buttons and manages demo state
 */
export default function AutoDemoController({
  isUserLoggedIn,
  isHomepage,
  terminalRef,
  onDemoStart,
  onDemoComplete,
  onDemoSkip
}: AutoDemoControllerProps) {
  const { demoState, skipDemo } = useAutoDemo({
    isUserLoggedIn,
    isHomepage,
    terminalRef,
    onDemoStart,
    onDemoComplete,
    onDemoSkip
  })

  // Don't render anything if demo is not running
  if (!demoState.isDemoRunning) {
    return null
  }

  const handleSkipToSignIn = () => {
    skipDemo()
    // Scroll to top where the sign-in button is
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {/* Skip Demo Button */}
      <button
        onClick={skipDemo}
        className="group relative px-6 py-3 bg-dark-card border-2 border-neon-cyan hover:border-neon-magenta text-neon-cyan hover:text-neon-magenta font-mono text-sm transition-all duration-300 rounded shadow-lg hover:shadow-neon-magenta/50"
      >
        <span className="relative z-10 flex items-center gap-2">
          <span>Skip Demo</span>
          <span className="text-xs opacity-60">(ESC)</span>
        </span>
        <div className="absolute inset-0 bg-neon-magenta/10 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
      </button>

      {/* Skip to Sign In Button */}
      <button
        onClick={handleSkipToSignIn}
        className="group relative px-6 py-3 bg-dark-card border-2 border-neon-green hover:border-neon-cyan text-neon-green hover:text-neon-cyan font-mono text-sm transition-all duration-300 rounded shadow-lg hover:shadow-neon-cyan/50"
      >
        <span className="relative z-10 flex items-center gap-2">
          <span>Skip to Sign In</span>
          <span>→</span>
        </span>
        <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
      </button>

      {/* Demo Progress Indicator */}
      <div className="text-center px-4 py-2 bg-dark-card/80 border border-neon-cyan/30 rounded font-mono text-xs text-gray-400">
        <span className="animate-pulse">
          {demoState.demoStep === 'scrolling' && '📍 Positioning terminal...'}
          {demoState.demoStep === 'typing' && '⌨️ Demo in progress...'}
          {demoState.demoStep === 'scanning' && '🔍 Scanning sources...'}
          {demoState.demoStep === 'synth' && '🤖 SYNTH mode demo...'}
        </span>
      </div>
    </div>
  )
}
