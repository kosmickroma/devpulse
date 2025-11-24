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
  audioUnlockCallback?: () => Promise<void>
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
  onDemoSkip,
  audioUnlockCallback
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

    // Lock scroll immediately
    document.body.style.overflow = 'hidden'

    // Calculate target scroll position
    const terminalRect = terminalRef.current.getBoundingClientRect()
    const targetY = window.scrollY + terminalRect.top - (window.innerHeight / 2) + (terminalRect.height / 2)

    // Smooth scroll with custom animation (guaranteed smooth)
    const startY = window.scrollY
    const distance = targetY - startY
    const duration = 1500 // 1.5 seconds
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-in-out)
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      window.scrollTo(0, startY + (distance * ease))

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration))
  }

  // Unlock scroll and restore user control
  const unlockScroll = () => {
    document.body.style.overflow = 'auto'
  }

  // Start demo sequence
  const startDemo = async () => {
    if (hasTriggered.current || demoState.isDemoRunning) return

    hasTriggered.current = true
    demoAbortController.current = new AbortController()

    // Audio unlock happens in event handler for trusted events (click/keydown)
    // For untrusted events (scroll/mousemove), audio may not unlock - that's OK
    // User can click anywhere during demo to enable audio

    // IMMEDIATELY lock scroll only - DON'T disable pointer events
    // (we need cards and filters to be clickable!)
    document.body.style.overflow = 'hidden'

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

    const addTrigger = (event: string, isTrustedEvent: boolean = false) => {
      const handler = async () => {
        console.log(`[AUTO-DEMO] Triggered by: ${event}`)

        // For trusted events (click/keydown), unlock audio in parallel (non-blocking)
        // This is CRITICAL - audio unlock must happen in the event handler itself
        // But we don't wait for it to complete, so demo starts instantly
        if (isTrustedEvent && audioUnlockCallback) {
          console.log('[AUTO-DEMO] Unlocking audio in event handler (trusted interaction)...')
          audioUnlockCallback().catch(error => {
            console.warn('[AUTO-DEMO] Audio unlock failed:', error)
          })
        }

        // Start demo immediately (audio unlock happens in parallel)
        startDemo()

        // Remove all listeners after first trigger
        listeners.forEach(({ event, handler }) => {
          window.removeEventListener(event, handler)
        })
      }

      window.addEventListener(event, handler, { once: true })
      listeners.push({ event, handler })
    }

    // Add triggers - only click/keydown are "trusted" for audio unlock
    addTrigger('scroll', false)      // Not trusted for audio
    addTrigger('click', true)        // TRUSTED - unlocks audio
    addTrigger('mousemove', false)   // Not trusted for audio
    addTrigger('keydown', true)      // TRUSTED - unlocks audio

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
