'use client'

import { useEffect, useRef, useState } from 'react'

interface AutoDemoState {
  isDemoRunning: boolean
  demoStep: string
  canSkip: boolean
}

interface AutoDemoOptions {
  isUserLoggedIn: boolean
  isHomepage: boolean
  terminalRef: React.RefObject<HTMLDivElement>
  onDemoStart: () => void
  onDemoComplete: () => void
  onDemoSkip: () => void
}

/**
 * Custom hook for auto-demo mode
 * Handles landing detection, trigger setup, and demo state management
 */
export function useAutoDemo({
  isUserLoggedIn,
  isHomepage,
  terminalRef,
  onDemoStart,
  onDemoComplete,
  onDemoSkip
}: AutoDemoOptions) {
  const [demoState, setDemoState] = useState<AutoDemoState>({
    isDemoRunning: false,
    demoStep: 'idle',
    canSkip: false
  })

  const hasTriggered = useRef(false)
  const demoAbortController = useRef<AbortController | null>(null)

  // Detect if user landed from external source
  const isExternalLanding = () => {
    if (typeof window === 'undefined') return false

    const referrer = document.referrer
    const currentHost = window.location.host

    // No referrer or referrer from different host = external landing
    return !referrer || !referrer.includes(currentHost)
  }

  // Scroll terminal to center and lock scroll
  const scrollToTerminalAndLock = async () => {
    if (!terminalRef.current) return

    // SLOW, dramatic scroll to center - feels alive!
    terminalRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })

    // Lock scroll
    document.body.style.overflow = 'hidden'

    // Wait for slow scroll to complete (1.5 seconds for dramatic effect)
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  // Unlock scroll and restore user control
  const unlockScroll = () => {
    document.body.style.overflow = 'auto'
    document.body.style.pointerEvents = 'auto' // Re-enable all interactions
  }

  // Start demo sequence
  const startDemo = async () => {
    if (hasTriggered.current || demoState.isDemoRunning) return

    hasTriggered.current = true
    demoAbortController.current = new AbortController()

    // IMMEDIATELY lock scroll and disable all user interaction
    document.body.style.overflow = 'hidden'
    document.body.style.pointerEvents = 'none' // Disable all clicks/interactions

    setDemoState({
      isDemoRunning: true,
      demoStep: 'scrolling',
      canSkip: true
    })

    try {
      // Slow scroll to terminal (feels magical)
      await scrollToTerminalAndLock()

      setDemoState(prev => ({ ...prev, demoStep: 'typing' }))

      // Call the demo start callback (terminal will handle typing animation)
      onDemoStart()

    } catch (error) {
      console.error('[AUTO-DEMO] Error during demo:', error)
      skipDemo()
    }
  }

  // Skip demo
  const skipDemo = () => {
    // Abort any ongoing operations
    if (demoAbortController.current) {
      demoAbortController.current.abort()
    }

    // Unlock scroll
    unlockScroll()

    // Reset state
    setDemoState({
      isDemoRunning: false,
      demoStep: 'idle',
      canSkip: false
    })

    // Notify parent
    onDemoSkip()
  }

  // Complete demo (called by terminal when sequence finishes)
  const completeDemo = () => {
    unlockScroll()

    setDemoState({
      isDemoRunning: false,
      demoStep: 'complete',
      canSkip: false
    })

    onDemoComplete()
  }

  // Setup trigger listeners
  useEffect(() => {
    // Only trigger for non-logged-in users on homepage landing from external source
    const shouldTrigger = !isUserLoggedIn && isHomepage && isExternalLanding()

    if (!shouldTrigger || hasTriggered.current) {
      return
    }

    console.log('[AUTO-DEMO] Conditions met, setting up triggers...')

    // Cleanup function to remove all listeners
    const listeners: Array<{ event: string; handler: () => void }> = []

    const addTrigger = (event: string) => {
      const handler = () => {
        console.log(`[AUTO-DEMO] Triggered by: ${event}`)
        startDemo()
        // Remove all listeners after first trigger
        listeners.forEach(({ event, handler }) => {
          window.removeEventListener(event, handler)
        })
      }

      window.addEventListener(event, handler, { once: true })
      listeners.push({ event, handler })
    }

    // Add triggers for ANY interaction
    addTrigger('scroll')
    addTrigger('click')
    addTrigger('mousemove')
    addTrigger('keydown')

    // Cleanup on unmount
    return () => {
      listeners.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler)
      })
    }
  }, [isUserLoggedIn, isHomepage])

  // ESC key to skip demo
  useEffect(() => {
    if (!demoState.isDemoRunning || !demoState.canSkip) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[AUTO-DEMO] User pressed ESC, skipping demo')
        skipDemo()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [demoState.isDemoRunning, demoState.canSkip])

  return {
    demoState,
    skipDemo,
    completeDemo
  }
}
