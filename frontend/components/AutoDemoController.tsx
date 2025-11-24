'use client'

import { useAutoDemo } from '@/hooks/useAutoDemo'

interface AutoDemoControllerProps {
  isUserLoggedIn: boolean
  isHomepage: boolean
  terminalRef: React.RefObject<HTMLDivElement>
  onDemoStart: () => void
  onDemoComplete: () => void
  onDemoSkip: () => void
  audioUnlockCallback?: () => Promise<void>
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
  onDemoSkip,
  audioUnlockCallback
}: AutoDemoControllerProps) {
  const { demoState, skipDemo } = useAutoDemo({
    isUserLoggedIn,
    isHomepage,
    terminalRef,
    onDemoStart,
    onDemoComplete,
    onDemoSkip,
    audioUnlockCallback
  })

  // Don't render anything if demo is not running
  if (!demoState.isDemoRunning) {
    return null
  }

  const handleSkipToSignIn = () => {
    skipDemo()
    // Navigate to auth page
    window.location.href = '/auth'
  }

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
      {/* Skip to Sign In Button */}
      <button
        onClick={handleSkipToSignIn}
        className="group relative px-6 py-3 bg-dark-card border-2 border-neon-green hover:border-neon-cyan text-neon-green hover:text-neon-cyan font-mono text-sm transition-all duration-300 rounded shadow-lg hover:shadow-neon-cyan/50"
      >
        <span className="relative z-10 flex items-center gap-2">
          <span>Skip to Sign In</span>
          <span className="text-xs opacity-60">(ESC)</span>
        </span>
        <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
      </button>
    </div>
  )
}
