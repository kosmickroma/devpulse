'use client'

import { useState, useEffect, useRef, KeyboardEvent, forwardRef, useImperativeHandle } from 'react'
import { TrendingItem } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { loadTodaysScanResults, saveScanResults } from '@/lib/db'
import { getMyProfile, type UserProfile } from '@/lib/profile'
import GameOverlay from './GameOverlay'
import SynthAvatar from './SynthAvatar'
import { simulateTyping, sleep, DEMO_TIMING } from '@/utils/demoHelpers'

interface TerminalLine {
  id: string
  text: string
  type: 'input' | 'output' | 'success' | 'error' | 'progress'
  timestamp: number
}

interface InteractiveTerminalProps {
  onDataReceived: (items: TrendingItem[]) => void
  selectedSources: string[]
  isDemoMode?: boolean
  onDemoComplete?: () => void
}

export interface InteractiveTerminalHandle {
  unlockAudio: () => Promise<void>
}

const InteractiveTerminal = forwardRef<InteractiveTerminalHandle, InteractiveTerminalProps>(({ onDataReceived, selectedSources, isDemoMode = false, onDemoComplete }, ref) => {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isSystemReady, setIsSystemReady] = useState(false)
  const [showInitOverlay, setShowInitOverlay] = useState(true)
  const [spinnerFrame, setSpinnerFrame] = useState(0) // NEW: for loading animation

  // Game overlay state
  const [activeGame, setActiveGame] = useState<'snake' | 'minesweeper' | 'spaceinvaders' | null>(null)
  const [showGamePrompt, setShowGamePrompt] = useState(false)
  const [scanCompleteNotification, setScanCompleteNotification] = useState(false)
  const [scanCompleteMessage, setScanCompleteMessage] = useState('')
  const [resultsFromCache, setResultsFromCache] = useState(false)

  // User profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // SYNTH AI mode state
  const [synthMode, setSynthMode] = useState(false)
  const [synthThinking, setSynthThinking] = useState(false)
  const [synthJustActivated, setSynthJustActivated] = useState(false)

  // Demo mode state
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [demoInputDisabled, setDemoInputDisabled] = useState(false)

  const terminalEndRef = useRef<HTMLDivElement>(null)
  const terminalContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<TrendingItem[]>([])
  const hasBooted = useRef(false)

  // Fallout 3 sound effects
  const sounds = useRef({
    typing: null as HTMLAudioElement | null,
    beep: null as HTMLAudioElement | null,
    error: null as HTMLAudioElement | null,
    success: null as HTMLAudioElement | null,
  })

  // Initialize sounds on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sounds.current = {
        typing: new Audio('/sounds/ui_hacking_charenter_01.wav'),
        beep: new Audio('/sounds/ui_hacking_charscroll.wav'),
        error: new Audio('/sounds/ui_hacking_passbad.wav'),
        success: new Audio('/sounds/ui_hacking_passgood.wav'),
      }
      // Preload sounds with louder volume
      Object.values(sounds.current).forEach(sound => {
        if (sound) {
          sound.volume = 0.5 // Increase from 0.3 to 0.5 for better audibility
          sound.load()
        }
      })
    }
  }, [])

  // Expose unlockAudio method via ref for demo mode
  useImperativeHandle(ref, () => ({
    unlockAudio: async () => {
      console.log('[TERMINAL] Unlocking audio...')

      // Unlock ALL audio elements by playing them silently
      const unlockPromises = Object.values(sounds.current).map(async (sound) => {
        if (sound) {
          try {
            sound.volume = 0 // Silent unlock
            const playPromise = sound.play()

            if (playPromise !== undefined) {
              await playPromise
              // Let it play for a tiny moment to fully unlock
              await new Promise(resolve => setTimeout(resolve, 30))
              sound.pause()
              sound.currentTime = 0
            }
            sound.volume = 0.5 // Restore to louder volume
          } catch (error) {
            console.warn('[TERMINAL] Audio unlock failed for sound:', error)
            sound.volume = 0.5 // Ensure volume is set even on error
          }
        }
      })

      await Promise.all(unlockPromises)
      setAudioEnabled(true)
      console.log('[TERMINAL] Audio unlocked successfully!')
    }
  }))

  // Handle system initialization (unlock audio and start boot)
  const handleInitialize = async () => {
    let audioUnlocked = false

    // First, unlock audio context with silent beep trick
    if (sounds.current.beep) {
      try {
        const beep = sounds.current.beep
        const originalVolume = beep.volume
        beep.volume = 0
        await beep.play()
        beep.pause()
        beep.currentTime = 0
        beep.volume = originalVolume
        audioUnlocked = true
        setAudioEnabled(true)
      } catch (error) {
        console.warn('Audio unlock failed:', error)
        // Still try to enable, but audio might not work
        setAudioEnabled(true)
      }
    }

    // Then play iconic boot-up sound (now that audio is unlocked)
    if (sounds.current.success && audioUnlocked) {
      setTimeout(() => {
        sounds.current.success?.play().catch(() => {})
      }, 100)
    }

    // Hide overlay and start system
    setShowInitOverlay(false)
    setIsSystemReady(true)
  }

  // Auto-scroll within terminal container only, but not on initial load
  useEffect(() => {
    if (terminalContainerRef.current && !isInitialLoad) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
    }
  }, [lines, isInitialLoad])

  // Mark initial load complete after boot sequence
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-focus input field when system is ready
  useEffect(() => {
    if (isSystemReady && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSystemReady])

  // Keyboard shortcut: Ctrl+S (Cmd+S on Mac) to toggle SYNTH mode
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Check for Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault() // Prevent browser save dialog

        // Toggle SYNTH mode
        setSynthMode(prev => {
          const newMode = !prev

          if (newMode) {
            // Entering SYNTH mode
            playSound('success')
            addLine('', 'output')
            addLine('╔══════════════════════════════════════════════╗', 'success')
            addLine('║     🤖 SYNTH CONVERSATION MODE ACTIVE        ║', 'success')
            addLine('╚══════════════════════════════════════════════╝', 'success')
            addLine('> Just type naturally to chat with SYNTH!', 'output')
            addLine('> Type "exit" to return to normal terminal', 'output')
            addLine('> ', 'output')
          } else {
            // Exiting SYNTH mode
            playBeep()
            addLine('', 'output')
            addLine('> Exiting SYNTH mode...', 'success')
            addLine('> Back to normal terminal', 'output')
            addLine('> ', 'output')
          }

          return newMode
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // Empty deps - only setup once

  // Spinner animation - rotates through cool retro characters when scanning
  useEffect(() => {
    if (!isScanning) return

    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const interval = setInterval(() => {
      setSpinnerFrame(prev => (prev + 1) % spinnerFrames.length)
    }, 80) // Fast rotation for smooth animation

    return () => clearInterval(interval)
  }, [isScanning])

  // SYNTH mode activation animation
  useEffect(() => {
    if (synthMode) {
      // Initial flicker animation (longer now - 2.5 seconds)
      setSynthJustActivated(true)
      // After 2.5 seconds, switch to steady subtle flicker
      const timer = setTimeout(() => {
        setSynthJustActivated(false)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [synthMode])

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const profileData = await getMyProfile()
      setProfile(profileData)
    }
    loadProfile()
  }, [])

  // Auto-scan after boot sequence completes
  const [hasAutoScanned, setHasAutoScanned] = useState(false)
  const [backfillStatus, setBackfillStatus] = useState<{
    last_updated: string | null
    total_trends: number
  } | null>(null)

  // Fetch backfill status on mount
  useEffect(() => {
    const fetchBackfillStatus = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/backfill/status`)
        const data = await response.json()
        setBackfillStatus(data)
      } catch (error) {
        console.warn('Failed to fetch backfill status:', error)
      }
    }
    fetchBackfillStatus()
  }, [])

  // Initial boot sequence - only runs after user initializes system
  useEffect(() => {
    if (!isSystemReady || hasBooted.current || isDemoMode) return // Don't run if not ready, already booted, or in demo mode

    hasBooted.current = true // Mark as booted

    // Build operator line with badge if equipped
    const badgeIcon = profile?.equipped_badge?.badges?.icon || ''
    // For SVG badges, use a special symbol in terminal text
    const operatorBadge = badgeIcon.startsWith('/') ? '◆' : badgeIcon
    const operatorName = profile?.username || 'Guest'
    const operatorLine = operatorBadge
      ? `> Operator: ${operatorBadge} @${operatorName}`
      : `> Operator: @${operatorName}`

    // Format last updated message
    let lastUpdatedLine = ''
    if (backfillStatus?.last_updated) {
      const lastUpdate = new Date(backfillStatus.last_updated)
      const now = new Date()
      const diffMs = now.getTime() - lastUpdate.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor(diffMs / (1000 * 60))

      if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24)
        lastUpdatedLine = `> Sources last updated: ${diffDays} day${diffDays > 1 ? 's' : ''} ago (${backfillStatus.total_trends} trends)`
      } else if (diffHours > 0) {
        lastUpdatedLine = `> Sources last updated: ${diffHours} hour${diffHours > 1 ? 's' : ''} ago (${backfillStatus.total_trends} trends)`
      } else if (diffMins > 0) {
        lastUpdatedLine = `> Sources last updated: ${diffMins} minute${diffMins > 1 ? 's' : ''} ago (${backfillStatus.total_trends} trends)`
      } else {
        lastUpdatedLine = `> Sources last updated: just now (${backfillStatus.total_trends} trends)`
      }
    }

    const bootLines = [
      { id: '1', text: '> DevPulse Terminal v4.6 - SYNTH AI Edition', type: 'output' as const, timestamp: Date.now() },
      { id: '2', text: '> Initializing systems...', type: 'output' as const, timestamp: Date.now() + 300 },
      { id: '3', text: '> [✓] GitHub API: ONLINE', type: 'success' as const, timestamp: Date.now() + 600 },
      { id: '4', text: '> [✓] Hacker News: ONLINE', type: 'success' as const, timestamp: Date.now() + 900 },
      { id: '5', text: '> [✓] Dev.to: ONLINE', type: 'success' as const, timestamp: Date.now() + 1200 },
      { id: '6', text: '> [✓] Reddit API: ONLINE', type: 'success' as const, timestamp: Date.now() + 1500 },
      { id: '7', text: '> [✓] Yahoo Finance: ONLINE', type: 'success' as const, timestamp: Date.now() + 1800 },
      { id: '8', text: '> [✓] CoinGecko: ONLINE', type: 'success' as const, timestamp: Date.now() + 2100 },
      { id: '9', text: '> [✓] IGN: ONLINE', type: 'success' as const, timestamp: Date.now() + 2400 },
      { id: '10', text: '> [✓] PC Gamer: ONLINE', type: 'success' as const, timestamp: Date.now() + 2700 },
      { id: '10.5', text: '> [✓] BBC News: ONLINE', type: 'success' as const, timestamp: Date.now() + 2850 },
      { id: '11', text: '> [✓] SYNTH AI: READY', type: 'success' as const, timestamp: Date.now() + 3150 },
      { id: '12', text: operatorLine, type: 'success' as const, timestamp: Date.now() + 3450 },
      ...(lastUpdatedLine ? [{ id: '13', text: lastUpdatedLine, type: 'output' as const, timestamp: Date.now() + 3750 }] : []),
      { id: '14', text: '> ', type: 'output' as const, timestamp: Date.now() + 4050 },
      { id: '15', text: '> 💡 Pro tip: Type "synth mode" or just talk naturally like "hey synth, find arcade games"', type: 'output' as const, timestamp: Date.now() + 4350 },
      { id: '16', text: '> ', type: 'output' as const, timestamp: Date.now() + 4650 },
    ]

    bootLines.forEach((line, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, line])
        playBeep() // Audio is now unlocked, sounds will play!
      }, line.timestamp - Date.now())
    })

    // Trigger cache check after boot completes
    setTimeout(() => {
      setHasAutoScanned(true)
    }, 4800)
  }, [isSystemReady, profile, backfillStatus])

  // Play sound helper with cloning for rapid-fire beeps
  const playSound = (soundType: 'typing' | 'beep' | 'error' | 'success') => {
    if (!audioEnabled || !sounds.current[soundType]) return

    const sound = sounds.current[soundType]
    if (sound) {
      // For beeps during rapid item display, clone the audio to prevent throttling
      if (soundType === 'beep') {
        const clone = sound.cloneNode() as HTMLAudioElement
        clone.volume = sound.volume
        clone.play().catch(() => {})
      } else {
        sound.currentTime = 0
        sound.play().catch(() => {})
      }
    }
  }

  // Play typing click
  const playTypingClick = () => {
    playSound('typing')
  }

  // Play general beep
  const playBeep = () => {
    playSound('beep')
  }

  // Play error sound
  const playError = () => {
    playSound('error')
  }

  // Play success sound
  const playSuccess = () => {
    playSound('success')
  }

  // Mute all sounds (for demo mode - audio unlocks silently)
  const muteAllSounds = () => {
    Object.values(sounds.current).forEach(sound => {
      if (sound) sound.volume = 0
    })
  }

  // Unmute all sounds (restore volume)
  const unmuteAllSounds = () => {
    Object.values(sounds.current).forEach(sound => {
      if (sound) sound.volume = 0.5
    })
  }

  // Handle asking SYNTH (reusable for all SYNTH queries)
  const handleAskSynth = async (question: string) => {
    if (!question || question.trim().length === 0) {
      playError()
      addLine('⚠️ Please ask a question', 'error')
      return
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      playError()
      addLine('⚠️ Authentication required', 'error')
      addLine('Please sign in to chat with SYNTH AI', 'output')
      return
    }

    // Call SYNTH
    playBeep()
    setSynthThinking(true)
    addLine('🤖 SYNTH is thinking...', 'progress')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'SYNTH is unavailable')
      }

      const data = await response.json()

      // Display SYNTH's response
      playSound('success')
      addLine('', 'output')
      data.response.split('\n').forEach((line: string) => {
        addLine(line, 'success')
      })
      addLine('', 'output')

      // If SYNTH found search results, pass to parent and display count
      if (data.search_results && data.search_results.length > 0) {
        onDataReceived(data.search_results)
        addLine(`✨ ${data.search_results.length} results added to cards below!`, 'output')
        addLine('💡 Look for the 🤖 SYNTH FINDS button to see them!', 'output')
        addLine('', 'output')
      }

      if (synthMode) {
        addLine(`💭 ${data.remaining} queries left | Type "exit" to leave SYNTH mode`, 'output')
      } else {
        addLine(`💭 ${data.remaining} AI queries left today`, 'output')
      }
    } catch (error: any) {
      playError()
      addLine(`⚠️ ${error.message}`, 'error')
    } finally {
      setSynthThinking(false)
    }
  }

  // Handle SYNTH search (search across sources)
  const handleSynthSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      playError()
      addLine('⚠️ Please provide a search query', 'error')
      return
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      playError()
      addLine('⚠️ Authentication required', 'error')
      addLine('Please sign in to use SYNTH search', 'output')
      return
    }

    // Call SYNTH search
    playBeep()
    setSynthThinking(true)
    addLine('🔍 SYNTH is searching across sources...', 'progress')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'SYNTH search failed')
      }

      const data = await response.json()

      // Display search results
      playSound('success')
      addLine('', 'output')
      addLine('╔══════════════════════════════════════════════════════════════╗', 'success')
      addLine(`║  🔍 SYNTH SEARCH RESULTS: ${data.total_found} found`, 'success')
      addLine('╚══════════════════════════════════════════════════════════════╝', 'success')
      addLine('', 'output')

      // Display SYNTH's commentary
      addLine('🤖 SYNTH says:', 'output')
      data.commentary.split('\n').forEach((line: string) => {
        addLine(`   ${line}`, 'success')
      })
      addLine('', 'output')

      // Display results
      if (data.results && data.results.length > 0) {
        addLine(`Top ${Math.min(data.results.length, 10)} results:`, 'output')
        addLine('', 'output')

        // Send results to parent to display as cards
        onDataReceived(data.results.slice(0, 10))

        data.results.slice(0, 10).forEach((item: any, idx: number) => {
          addLine(`${idx + 1}. ${item.title}`, 'success')
          addLine(`   🔗 ${item.url}`, 'output')
          if (item.language) addLine(`   Language: ${item.language}`, 'output')
          if (item.stars) addLine(`   ⭐ ${item.stars}`, 'output')
          addLine('', 'output')
        })
        addLine('💡 Cards updated below!', 'output')
      }

      addLine(`💭 ${data.remaining} AI queries left today`, 'output')
      addLine('', 'output')

    } catch (error: any) {
      playError()
      addLine(`⚠️ ${error.message}`, 'error')
    } finally {
      setSynthThinking(false)
    }
  }

  // Smart SYNTH routing - ALL queries go to ask endpoint with intelligent search
  const routeSynthQuery = async (query: string) => {
    // Let the ask endpoint handle everything - it has intelligent GitHub search
    await handleAskSynth(query)
  }

  // Handle command execution
  const executeCommand = async (command: string) => {
    const trimmed = command.trim()
    const lowerTrimmed = trimmed.toLowerCase()

    // Add input line with SYNTH prompt if in SYNTH mode
    if (synthMode) {
      addLine(`SYNTH > ${command}`, 'input')
    } else {
      addLine(`> ${command}`, 'input')
    }

    // If in SYNTH mode, everything goes to AI (intelligent routing)
    if (synthMode) {
      // Special commands to exit SYNTH mode
      if (lowerTrimmed === 'exit' || lowerTrimmed === 'back' || lowerTrimmed === 'quit') {
        playBeep()
        setSynthMode(false)
        addLine('', 'output')
        addLine('> Exiting SYNTH mode...', 'success')
        addLine('> Back to normal terminal', 'output')
        addLine('', 'output')
        return
      }

      // Everything else goes through intelligent routing
      await routeSynthQuery(trimmed)
      return
    }

    // Parse command
    const parts = lowerTrimmed.split(' ')
    const cmd = parts[0]
    const args = parts.slice(1)

    // Natural language detection for SYNTH - greetings and explicit commands
    const naturalPhrases = ['hey', 'yo', 'hi', 'synth', 'find', 'search']

    if (naturalPhrases.includes(cmd)) {
      // Extract the actual query
      let query = trimmed

      // Remove greeting/trigger words
      if (cmd === 'hey' || cmd === 'yo' || cmd === 'hi') {
        // "hey synth, show me..." or "yo synth what is..."
        if (parts[1] === 'synth' || parts[1] === 'ai') {
          query = parts.slice(2).join(' ').replace(/^,\s*/, '') // Remove "hey synth," part
        } else {
          // "hey, what is..." - still route to SYNTH
          query = parts.slice(1).join(' ').replace(/^,\s*/, '')
        }
      } else if (cmd === 'synth') {
        // "synth mode" is a command, but "synth, show me..." is natural
        if (args[0] === 'mode') {
          // Don't route this - let it fall through to switch statement
        } else {
          query = args.join(' ').replace(/^,\s*/, '')
          if (query) {
            await routeSynthQuery(query)
            return
          }
        }
      } else if (['find', 'search'].includes(cmd)) {
        // "find arcade games", "search for tutorials", etc.
        query = args.join(' ').replace(/^(me|for)\s+/, '') // Remove "me" or "for"
        if (query) {
          await handleSynthSearch(query)
          return
        }
      }

      // If we extracted a query, route it (but skip if it's a command like "synth mode")
      if (query && query.trim().length > 0 && !(cmd === 'synth' && args[0] === 'mode')) {
        await routeSynthQuery(query)
        return
      }
    }

    switch (cmd) {
      case 'help':
        playBeep()
        addLine('Available commands:', 'output')
        addLine('  scan [source] - Scan a specific source for trending content', 'output')
        addLine('                 (github, hacker news, devto, reddit, stocks, crypto, ign, pc gamer)', 'output')
        addLine('  scan github [language] - Scan GitHub for specific language', 'output')
        addLine('  jobs - Browse 100+ tech companies hiring', 'output')
        addLine('  jobs search [keyword] - Filter companies by keyword', 'output')
        addLine('  jobs [remote|visa|startup|intern] - Filter by category', 'output')
        addLine('  games - List available mini-games', 'output')
        addLine('  game [name] - Launch a mini-game (e.g., game snake)', 'output')
        addLine('  ', 'output')
        addLine('🤖 SYNTH AI ASSISTANT - Just talk naturally!', 'success')
        addLine('  synth mode - Enter conversation mode', 'output')
        addLine('  ', 'output')
        addLine('  Examples (no commands needed!):', 'output')
        addLine('    "hey synth, what is React?"', 'output')
        addLine('    "yo synth explain async await"', 'output')
        addLine('    "find arcade games on github"', 'output')
        addLine('    "show me python tutorials"', 'output')
        addLine('    "grab some rust projects"', 'output')
        addLine('  ', 'output')
        addLine('  command center / cc - Enter Command Center workspace', 'output')
        addLine('  clear - Clear terminal', 'output')
        addLine('  help - Show this help message', 'output')
        break

      case 'scan':
        if (isScanning) {
          playError()
          addLine('⚠ Scan already in progress!', 'error')
          addLine('Wait for current scan to complete, or type "game snake" to play while you wait', 'output')
        } else {
          await handleScan(args)
        }
        break

      case 'jobs':
        await handleJobs(args)
        break

      case 'games':
        playBeep()
        addLine('🎮 Available Mini-Games:', 'output')
        addLine('  snake - Classic snake game with neon aesthetic', 'success')
        addLine('  minesweeper - Neon minesweeper with 3 difficulty levels', 'success')
        addLine('  spaceinvaders - Retro alien shooter with waves', 'success')
        addLine('  ', 'output')
        addLine('Usage: game [name] (e.g., "game spaceinvaders")', 'output')
        addLine('Press ESC while playing to return to terminal', 'output')
        break

      case 'game':
        playBeep()
        if (args[0] === 'snake') {
          addLine('> Launching Snake...', 'success')
          setTimeout(() => setActiveGame('snake'), 300)
        } else if (args[0] === 'minesweeper' || args[0] === 'mine' || args[0] === 'mines') {
          addLine('> Launching Minesweeper...', 'success')
          setTimeout(() => setActiveGame('minesweeper'), 300)
        } else if (args[0] === 'spaceinvaders' || args[0] === 'space' || args[0] === 'invaders') {
          addLine('> Launching Space Invaders...', 'success')
          setTimeout(() => setActiveGame('spaceinvaders'), 300)
        } else if (args.length === 0) {
          addLine('Usage: game [name]', 'error')
          addLine('Type "games" to see available games', 'output')
        } else {
          playError()
          addLine(`Game not found: ${args[0]}`, 'error')
          addLine('Type "games" to see available games', 'output')
        }
        break

      case 'clear':
        playBeep()
        setLines([])
        addLine('> Terminal cleared', 'success')
        break

      case 'synth':
      case 'ai':
        // Check for "synth mode" to enter conversation mode
        if (args[0] === 'mode') {
          playSound('success')
          setSynthMode(true)
          addLine('', 'output')
          addLine('╔══════════════════════════════════════════════╗', 'success')
          addLine('║     🤖 SYNTH CONVERSATION MODE ACTIVE        ║', 'success')
          addLine('╠══════════════════════════════════════════════╣', 'output')
          addLine('║  Everything you type goes to SYNTH.          ║', 'output')
          addLine('║  Just talk naturally!                        ║', 'output')
          addLine('║                                              ║', 'output')
          addLine('║  Type "exit" or "back" to leave SYNTH mode   ║', 'output')
          addLine('╚══════════════════════════════════════════════╝', 'output')
          addLine('', 'output')
          break
        }

        // Show SYNTH info
        playBeep()
        addLine('╔══════════════════════════════════════════════╗', 'output')
        addLine('║        🤖 SYNTH - Your AI Assistant          ║', 'success')
        addLine('╠══════════════════════════════════════════════╣', 'output')
        addLine('║ Just talk naturally - no commands needed!   ║', 'output')
        addLine('║                                              ║', 'output')
        addLine('║ ASK QUESTIONS:                               ║', 'output')
        addLine('║   "hey synth, what is React?"                ║', 'output')
        addLine('║   "yo synth explain async await"             ║', 'output')
        addLine('║   "how do I center a div?"                   ║', 'output')
        addLine('║                                              ║', 'output')
        addLine('║ SEARCH FOR CONTENT:                          ║', 'output')
        addLine('║   "find arcade games on github"              ║', 'output')
        addLine('║   "show me python tutorials"                 ║', 'output')
        addLine('║   "grab rust machine learning repos"         ║', 'output')
        addLine('║                                              ║', 'output')
        addLine('║ CONVERSATION MODE:                           ║', 'output')
        addLine('║   Type "synth mode" for continuous chat      ║', 'output')
        addLine('║                                              ║', 'output')
        addLine('║ SYNTH is your chill 80s AI powered by        ║', 'output')
        addLine('║ Google Gemini. Searches GitHub, Reddit, etc  ║', 'output')
        addLine('║                                              ║', 'output')
        addLine('║ LIMITS: 50 queries/day (sign in required)   ║', 'output')
        addLine('╚══════════════════════════════════════════════╝', 'output')
        break

      case 'command-center':
      case 'command':
      case 'cc':
      case 'workspace':
        playBeep()
        addLine('', 'output')
        addLine('> ENTERING COMMAND CENTER...', 'success')
        addLine('> Initializing workspace...', 'output')
        setTimeout(() => {
          window.location.href = '/workspace'
        }, 800)
        break

      case '':
        // Empty command, do nothing
        break

      default:
        playError()
        addLine(`Command not found: ${cmd}`, 'error')
        addLine('Type "help" for available commands', 'output')
    }
  }

  // Parse source name from command arguments, handling multi-word sources
  const parseSourceFromArgs = (args: string[]): { platform: string, remainingArgs: string[] } => {
    if (args.length === 0) {
      return { platform: '', remainingArgs: [] }
    }

    // Known multi-word source mappings (display name variations → source ID)
    const multiWordSources: { [key: string]: string } = {
      'pc gamer': 'pcgamer',
      'pcgamer': 'pcgamer',
      'hacker news': 'hackernews',
      'hackernews': 'hackernews',
      'dev.to': 'devto',
      'devto': 'devto'
    }

    // Try 2-word combination first
    if (args.length >= 2) {
      const twoWord = `${args[0]} ${args[1]}`.toLowerCase()
      if (multiWordSources[twoWord]) {
        return {
          platform: multiWordSources[twoWord],
          remainingArgs: args.slice(2)
        }
      }
    }

    // Fall back to single word
    const singleWord = args[0].toLowerCase()
    if (multiWordSources[singleWord]) {
      return {
        platform: multiWordSources[singleWord],
        remainingArgs: args.slice(1)
      }
    }

    // Return as-is for single-word sources (github, reddit, stocks, etc.)
    return {
      platform: args[0],
      remainingArgs: args.slice(1)
    }
  }

  // Handle scan command
  const handleScan = async (args: string[]) => {
    setIsScanning(true)
    setProgress(0)
    itemsRef.current = []

    // Parse source name handling multi-word sources
    const { platform: parsedPlatform, remainingArgs } = parseSourceFromArgs(args)
    let platform = parsedPlatform
    const language = remainingArgs[0] || ''

    // If no platform specified in command, use selected sources
    if (!platform) {
      if (selectedSources.length === 0 || selectedSources.length === 3) {
        // No sources selected or all selected = scan all
        platform = 'all'
      } else if (selectedSources.length === 1) {
        // Single source selected
        platform = selectedSources[0]
      } else {
        // Multiple sources selected = scan all (backend will filter)
        platform = 'all'
      }
    }

    playBeep()
    const sourcesList = selectedSources.length > 0
      ? selectedSources.map(s => s.toUpperCase()).join(', ')
      : 'ALL'
    addLine(`Initiating scan: ${platform.toUpperCase()}${language ? ` (${language})` : ''}...`, 'output')
    addLine(`Active sources: ${sourcesList}`, 'output')

    try {
      // Connect to SSE endpoint (Render backend)
      const url = `https://devpulse-api.onrender.com/api/scan?platform=${platform}${language ? `&language=${language}` : ''}`
      const eventSource = new EventSource(url)

      // Add timeout to detect if backend is sleeping (30 seconds)
      const timeoutId = setTimeout(() => {
        addLine('> ', 'output')
        addLine('⏱️ Backend is taking longer than expected...', 'error')
        addLine('> The Render free tier may be sleeping. This can take up to 60 seconds.', 'output')
        addLine('> Please wait or try again in a moment.', 'output')
      }, 30000)

      let hasReceivedData = false

      eventSource.onmessage = (event) => {
        if (!hasReceivedData) {
          clearTimeout(timeoutId)
          hasReceivedData = true
        }

        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'status':
            addLine(`> ${data.message}`, 'output')
            playBeep()
            break

          case 'spider_start':
            addLine(`> Connecting to ${data.spider}...`, 'output')
            playBeep()
            break

          case 'connecting':
            addLine(`> ${data.message}`, 'output')
            playBeep()
            break

          case 'scanning':
            addLine(`> ${data.message}`, 'success')
            playBeep()
            break

          case 'item':
            itemsRef.current.push(data.data)
            playBeep()
            const item = data.data
            const title = item?.title || 'Untitled'
            const displayTitle = title.length > 60 ? title.substring(0, 60) + '...' : title
            addLine(`  ✓ ${displayTitle}`, 'success')
            setProgress(itemsRef.current.length) // Use actual item count, not increment
            break

          case 'spider_complete':
            addLine(`> ${data.spider} scan complete`, 'success')
            playBeep()
            break

          case 'scan_complete':
            clearTimeout(timeoutId)
            addLine('> ', 'output')
            // Count unique items by URL (matches what user will see in cards)
            const uniqueUrls = new Set(itemsRef.current.map(item => item.url))
            const uniqueCount = uniqueUrls.size
            addLine(`✓ Scan complete! Found ${uniqueCount} unique items`, 'success')
            playSuccess()
            eventSource.close()
            setIsScanning(false)
            setShowGamePrompt(false)

            // ALWAYS show notification, then check if game is active
            console.log('Scan complete! activeGame:', activeGame)
            setScanCompleteNotification(true)
            setScanCompleteMessage(`Found ${uniqueCount} unique trending items!`)

            // Send data to parent
            onDataReceived(itemsRef.current)

            // Save to database (optional, non-breaking)
            saveScanResults(itemsRef.current)
            setResultsFromCache(false)
            break

          case 'error':
            addLine(`✗ Error: ${data.message}`, 'error')
            playError()
            break
        }
      }

      eventSource.onerror = () => {
        clearTimeout(timeoutId)
        addLine('✗ Connection error. Backend may be waking up...', 'error')
        addLine('  (Render free tier sleeps after inactivity - try again in 30 sec)', 'output')
        playError()
        eventSource.close()
        setIsScanning(false)
      }

    } catch (error) {
      addLine(`✗ Error: ${error}`, 'error')
      playError()
      setIsScanning(false)
    }
  }

  // Handle jobs command
  const handleJobs = async (args: string[]) => {
    playBeep()

    try {
      const response = await fetch('/jobs.json')
      const data = await response.json()
      const companies = data.companies || []

      let filtered = companies
      let filterLabel = 'All Companies'

      // Handle different filters
      if (args.length > 0) {
        const command = args[0].toLowerCase()

        if (command === 'search' && args.length > 1) {
          const keyword = args.slice(1).join(' ').toLowerCase()
          filtered = companies.filter((c: any) =>
            c.name.toLowerCase().includes(keyword) ||
            c.description?.toLowerCase().includes(keyword) ||
            c.tech_stack?.some((tech: string) => tech.toLowerCase().includes(keyword)) ||
            c.categories?.some((cat: string) => cat.toLowerCase().includes(keyword))
          )
          filterLabel = `Search: "${keyword}"`
        } else if (command === 'remote') {
          filtered = companies.filter((c: any) => c.categories?.includes('remote-friendly'))
          filterLabel = 'Remote-Friendly Companies'
        } else if (command === 'visa') {
          filtered = companies.filter((c: any) => c.categories?.includes('visa-sponsor'))
          filterLabel = 'Visa Sponsors'
        } else if (command === 'startup') {
          filtered = companies.filter((c: any) => c.categories?.includes('startup'))
          filterLabel = 'Startups'
        } else if (command === 'intern') {
          filtered = companies.filter((c: any) => c.categories?.includes('intern-program'))
          filterLabel = 'Internship Programs'
        } else {
          playError()
          addLine(`Unknown filter: ${command}`, 'error')
          addLine('Use: jobs search [keyword], jobs remote, jobs visa, jobs startup, or jobs intern', 'output')
          return
        }
      }

      // Display results
      addLine('═══════════════════════════════════════════════════════════', 'output')
      addLine(`  ${filterLabel} (${filtered.length} results)`, 'success')
      addLine('═══════════════════════════════════════════════════════════', 'output')
      addLine('', 'output')

      if (filtered.length === 0) {
        addLine('No companies found matching your criteria.', 'error')
      } else {
        // Show max 15 companies at a time
        const displayCount = Math.min(filtered.length, 15)
        filtered.slice(0, displayCount).forEach((company: any) => {
          addLine(`▸ ${company.name}`, 'success')
          if (company.description) {
            addLine(`  ${company.description}`, 'output')
          }
          if (company.tech_stack && company.tech_stack.length > 0) {
            addLine(`  Tech: ${company.tech_stack.slice(0, 5).join(', ')}`, 'output')
          }
          if (company.locations && company.locations.length > 0) {
            addLine(`  📍 ${company.locations.slice(0, 3).join(', ')}`, 'output')
          }
          addLine(`  🔗 ${company.career_url}`, 'output')
          addLine('', 'output')
        })

        if (filtered.length > 15) {
          addLine(`... and ${filtered.length - 15} more companies`, 'output')
          addLine(`Visit /jobs page for full list`, 'output')
        }
      }

      addLine('═══════════════════════════════════════════════════════════', 'output')
      playSuccess()

    } catch (error) {
      playError()
      addLine(`Error loading jobs database: ${error}`, 'error')
    }
  }

  // Add line to terminal
  const addLine = (text: string, type: TerminalLine['type']) => {
    setLines(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text,
      type,
      timestamp: Date.now()
    }])
  }

  // ============================================
  // AUTO-DEMO MODE ORCHESTRATION
  // ============================================

  /**
   * Run the complete auto-demo sequence
   * This is called by the AutoDemoController when triggered
   */
  const runAutoDemo = async () => {
    console.log('[DEMO] Starting auto-demo sequence...')
    setIsDemoRunning(true)
    setDemoInputDisabled(true)

    // Mute all sounds at start - audio unlocks silently
    muteAllSounds()

    try {
      // STEP 1: Wait for SLOW scroll to complete (1.5s for dramatic "WTF is happening" effect)
      await sleep(1500)

      // STEP 2: Terminal "boots up" - play boot sound (muted)
      playSuccess()
      await sleep(200)

      // Start scan in background DURING boot sequence
      // This gives scan time to warm up while typing happens
      const scanStartDelay = 500 // Start scan 500ms from now (DURING boot lines)
      const demoScanPromise = sleep(scanStartDelay).then(() => handleDemoScan())

      // STEP 3: Show boot sequence (buying time while scan runs in background)
      // NO SOUNDS YET - give audio time to unlock properly
      const bootLines = [
        '> DevPulse Terminal v4.5 - SYNTH AI Edition',
        '> Initializing systems...',
        '> [✓] GitHub API: ONLINE',
        '> [✓] Hacker News: ONLINE',
        '> [✓] Dev.to: ONLINE',
        '> [✓] Reddit API: ONLINE',
        '> [✓] Yahoo Finance: ONLINE',
        '> [✓] CoinGecko: ONLINE',
        '> [✓] IGN: ONLINE',
        '> [✓] PC Gamer: ONLINE',
        '> [✓] SYNTH AI: READY',
        '> '
      ]

      for (const line of bootLines) {
        addLine(line, line.includes('[✓]') ? 'success' : 'output')
        // No beeps here - silent boot sequence
        await sleep(150) // Fast but visible
      }

      await sleep(300)

      // STEP 4: Type "Initiating DEMO MODE..." (recreating real terminal feel)
      // Still no sound - just visual typing
      let demoText = ''
      await simulateTyping('Initiating DEMO MODE...', (char) => {
        demoText += char
        setCurrentInput(demoText)
        // No typing sound yet
      }, DEMO_TIMING.TYPING_SPEED_WPM)

      addLine(`> ${demoText}`, 'success')
      setCurrentInput('')
      await sleep(500)

      // STEP 5: Type "scan all" command - UNMUTE AND START AUDIO HERE
      // By now, ~2-3 seconds have passed and audio is definitely unlocked
      unmuteAllSounds() // Restore volume before typing starts

      demoText = ''
      await simulateTyping('scan all', (char) => {
        demoText += char
        setCurrentInput(demoText)
        playSound('typing') // Now audible!
      }, DEMO_TIMING.TYPING_SPEED_WPM)

      addLine(`> ${demoText}`, 'input')
      setCurrentInput('')
      await sleep(300)

      // STEP 6: Hit ENTER sound
      playSuccess()

      // Wait for background scan to complete (it's already running)
      await demoScanPromise

    } catch (error) {
      console.error('[DEMO] Error during demo:', error)
      setIsDemoRunning(false)
      setDemoInputDisabled(false)
    }
  }

  /**
   * Handle demo scan with dual-stream (cached + fresh)
   */
  const handleDemoScan = async () => {
    setIsScanning(true)
    setProgress(0)
    itemsRef.current = []

    playBeep()
    addLine('Initiating scan: ALL...', 'output')
    addLine('Active sources: GITHUB, REDDIT, HACKERNEWS, DEV.TO, STOCKS, CRYPTO', 'output')
    addLine('  ', 'output')

    try {
      // Connect to DEMO endpoint (cached burst + fresh scan)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devpulse-api.onrender.com'
      const url = `${API_URL}/api/scan?platform=all&demo=true`
      const eventSource = new EventSource(url)

      let hasSeenCachedBurst = false

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'cached_item':
            // Cached item from demo burst - silently add without announcement
            itemsRef.current.push(data.data)
            playBeep()
            const cachedItem = data.data
            const cachedTitle = cachedItem?.title || 'Untitled'
            const cachedDisplay = cachedTitle.length > 60 ? cachedTitle.substring(0, 60) + '...' : cachedTitle
            addLine(`  ✓ ${cachedDisplay}`, 'success')
            setProgress(itemsRef.current.length) // Use actual item count
            break

          case 'status':
            addLine(`> ${data.message}`, 'output')
            playBeep()
            break

          case 'item':
            // Fresh item from real-time scan
            itemsRef.current.push(data.data)
            playBeep()
            const item = data.data
            const title = item?.title || 'Untitled'
            const displayTitle = title.length > 60 ? title.substring(0, 60) + '...' : title
            addLine(`  ✓ ${displayTitle}`, 'success')
            setProgress(itemsRef.current.length) // Use actual item count
            break

          case 'scan_complete':
            addLine('> ', 'output')
            // Count unique items by URL (matches what user will see in cards)
            const demoUniqueUrls = new Set(itemsRef.current.map(item => item.url))
            const demoUniqueCount = demoUniqueUrls.size
            addLine(`✓ Scan complete! Found ${demoUniqueCount} unique items`, 'success')
            playSuccess()
            eventSource.close()
            setIsScanning(false)

            // Send data to parent
            onDataReceived(itemsRef.current)
            saveScanResults(itemsRef.current)

            // Transition to SYNTH mode demo (1500ms ensures all beep sounds finish)
            setTimeout(() => {
              transitionToSynthDemo()
            }, 1500)
            break

          case 'error':
            addLine(`✗ Error: ${data.message}`, 'error')
            playError()
            break
        }
      }

      eventSource.onerror = () => {
        addLine('✗ Connection error during demo', 'error')
        playError()
        eventSource.close()
        setIsScanning(false)
        setIsDemoRunning(false)
        setDemoInputDisabled(false)
      }

    } catch (error) {
      addLine(`✗ Error: ${error}`, 'error')
      playError()
      setIsScanning(false)
      setIsDemoRunning(false)
      setDemoInputDisabled(false)
    }
  }

  /**
   * Transition to SYNTH mode and run SYNTH demo
   */
  const transitionToSynthDemo = async () => {
    try {
      // STEP 1: Type "Initiating SYNTH MODE..." (faster typing - 120 WPM)
      await sleep(500)
      let synthText = ''
      await simulateTyping('Initiating SYNTH MODE...', (char) => {
        synthText += char
        setCurrentInput(synthText)
        playSound('typing')
      }, 120) // 2x faster than intro

      addLine(`> ${synthText}`, 'success')
      setCurrentInput('')
      await sleep(500)

      // STEP 2: Activate SYNTH mode (existing state/styles)
      setSynthMode(true)
      playSuccess()
      await sleep(500)

      // STEP 3: Type natural conversational question (faster typing - 120 WPM)
      synthText = ''
      await simulateTyping('hey synth, what are the best terminal tools for developers?', (char) => {
        synthText += char
        setCurrentInput(synthText)
        playSound('typing')
      }, 120) // 2x faster

      addLine(`SYNTH > ${synthText}`, 'input')
      setCurrentInput('')
      await sleep(300)

      // STEP 4: Show SYNTH is thinking (like the real AI)
      playBeep()
      addLine('🤖 SYNTH is thinking...', 'progress')
      await sleep(800)

      // Fetch pre-cached demo results
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devpulse-api.onrender.com'
      const response = await fetch(`${API_URL}/api/demo/synth-search`)
      const result = await response.json()

      // STEP 5: Display AI conversational response FIRST
      playSuccess()
      addLine('', 'output')
      addLine('🤖 SYNTH:', 'success')
      // Split summary into lines and display naturally
      const summaryLines = result.summary.split('. ')
      for (const line of summaryLines) {
        if (line.trim()) {
          addLine(`   ${line.trim()}${line.endsWith('.') ? '' : '.'}`, 'output')
        }
      }
      addLine('', 'output')
      await sleep(600)

      // STEP 6: Then show search results
      playBeep()
      addLine('🔍 I found some awesome tools for you:', 'success')
      addLine('', 'output')

      // Display top 5 results with beep sounds (matching what we show in terminal)
      const displayCount = Math.min(5, result.results.length)
      for (const item of result.results.slice(0, displayCount)) {
        playBeep()
        addLine(`✓ ${item.title}`, 'success')
        addLine(`  🔗 ${item.url}`, 'output')
        if (item.stars) addLine(`  ⭐ ${item.stars} stars`, 'output')
        if (item.language) addLine(`  📝 ${item.language}`, 'output')
        addLine('', 'output')
        await sleep(150)
      }

      // Message depends on whether we showed all results or just a preview
      if (result.results.length <= displayCount) {
        addLine(`✨ All ${result.results.length} results added to cards below!`, 'output')
      } else {
        addLine(`✨ ${displayCount} results previewed above. All ${result.results.length} results added to cards below!`, 'output')
      }
      addLine('', 'output')

      // Send to parent to display as cards
      onDataReceived(result.results)

      // STEP 5: Demo complete - first message (much faster - 150 WPM)
      await sleep(1000)
      synthText = ''
      await simulateTyping('End demo - scroll down for results', (char) => {
        synthText += char
        setCurrentInput(synthText)
        playSound('typing')
      }, 150) // 2.5x faster - we've already shown off!

      addLine(`> ${synthText}`, 'success')
      setCurrentInput('')
      await sleep(500)

      // STEP 6: Call to action - sign up message (much faster - 150 WPM)
      synthText = ''
      await simulateTyping('Sign up to try it yourself!', (char) => {
        synthText += char
        setCurrentInput(synthText)
        playSound('typing')
      }, 150) // 2.5x faster

      addLine(`> ${synthText}`, 'success')
      setCurrentInput('')

      // Enable user input and restore control
      setIsDemoRunning(false)
      setDemoInputDisabled(false)
      setSynthMode(false)

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus()
      }, 500)

      // Notify parent
      if (onDemoComplete) {
        onDemoComplete()
      }

    } catch (error) {
      console.error('[DEMO] Error during SYNTH transition:', error)
      setIsDemoRunning(false)
      setDemoInputDisabled(false)
      setSynthMode(false)
    }
  }

  // Expose runAutoDemo for external triggering
  useEffect(() => {
    if (isDemoMode && !isDemoRunning) {
      // Auto-dismiss the init overlay for demo mode
      setShowInitOverlay(false)
      setIsSystemReady(true)
      setAudioEnabled(true)

      // Audio unlock is handled by useAutoDemo hook via audioUnlockCallback
      // This ensures unlock happens on REAL user interaction, not prop change

      // Start demo immediately - no delay needed
      console.log('[DEMO] Starting demo...')
      runAutoDemo()
    }
  }, [isDemoMode])

  // Load cached results and trigger auto-scan
  useEffect(() => {
    if (hasAutoScanned && !isScanning && !isDemoMode) {
      // Try to load cached results first
      loadTodaysScanResults().then(cachedItems => {
        if (cachedItems.length > 0) {
          // We have cached results! Show them and skip auto-scan
          addLine(`> Loading cached results from today...`, 'output')
          addLine(`> Found ${cachedItems.length} cached items`, 'success')
          onDataReceived(cachedItems)
          setResultsFromCache(true)
          playSuccess()
          addLine('> ', 'output')
          addLine('💡 Showing cached results. Type "scan" to refresh with latest data', 'output')
          addLine('> ', 'output')
        } else {
          // No cache, run normal scan
          addLine('> No cached results found. Running fresh scan...', 'output')
          handleScan([])
        }
      })
    }
  }, [hasAutoScanned])

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      // Allow commands during scanning (game, help, clear, etc.)
      // The executeCommand function will handle scan-specific logic
      executeCommand(currentInput)
      setCurrentInput('')
    } else if (e.key.length === 1) {
      // Audio will be enabled by event listener in useEffect
      playTypingClick()
    }
  }

  // Get line color based on type
  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-neon-cyan'
      case 'success': return 'text-neon-green'
      case 'error': return 'text-neon-magenta'
      default: return 'text-gray-300'
    }
  }

  return (
    <>
      {/* Game Overlay */}
      <GameOverlay
        game={activeGame}
        onClose={() => {
          console.log('Closing game overlay')
          setActiveGame(null)
          setScanCompleteNotification(false)
          setScanCompleteMessage('')
          // Refocus input when game closes
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
        showNotification={scanCompleteNotification}
        notificationMessage={scanCompleteMessage}
      />

      <div className={`relative max-w-5xl mx-auto rounded-lg overflow-hidden backdrop-blur transition-all duration-500 ${
        synthMode
          ? 'border-4 border-neon-magenta bg-dark-card/80 shadow-[0_0_30px_rgba(255,0,255,0.8),0_0_60px_rgba(255,0,255,0.4)]'
          : 'neon-border bg-dark-card/90'
      }`}>
        {/* Flickering Border Overlay - Only in SYNTH mode */}
        {synthMode && (
          <div
            className={`absolute inset-0 rounded-lg pointer-events-none z-50 border-4 border-neon-magenta ${
              synthJustActivated ? 'synth-border-flicker-on' : 'synth-border-steady'
            }`}
            style={{ background: 'transparent' }}
          />
        )}
        {/* SYNTH Mode Overlay - Clean and Simple */}
        {synthMode && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="perspective-grid" style={{ height: '100%' }} />
            </div>

            {/* Subtle Particles */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="synth-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `-${Math.random() * 20}px`,
                  width: `${2 + Math.random() * 2}px`,
                  height: `${2 + Math.random() * 2}px`,
                  opacity: 0.15 + Math.random() * 0.15,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${4 + Math.random() * 3}s`,
                  '--drift': `${(Math.random() - 0.5) * 100}px`,
                  boxShadow: i % 2 === 0
                    ? '0 0 6px #00ffff'
                    : '0 0 6px #ff00ff'
                } as React.CSSProperties}
              />
            ))}

            {/* KITT Scanner - Only when thinking */}
            {synthThinking && (
              <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden z-20">
                <div
                  className="kitt-scanner"
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '150px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 0, 255, 1), transparent)',
                    boxShadow: '0 0 30px rgba(255, 0, 255, 1), 0 0 60px rgba(255, 0, 255, 0.5)',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Terminal Header */}
      <div className={`border-b px-4 py-2 flex items-center gap-3 relative z-10 synth-crt ${
        synthMode
          ? 'bg-dark-hover/80 border-neon-magenta/50'
          : 'bg-dark-hover border-neon-cyan/30'
      }`}>
        {/* Traffic Light Dots */}
        <div className={`w-3 h-3 rounded-full shadow-neon-magenta ${synthMode ? 'bg-neon-magenta animate-pulse' : 'bg-neon-magenta'}`} />
        <div className="w-3 h-3 rounded-full bg-neon-green shadow-neon-green" />
        <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-neon-cyan" />

        {/* SYNTH Avatar (when active) */}
        {(synthMode || synthThinking) && (
          <div className="ml-2">
            <SynthAvatar
              isThinking={synthThinking}
              mode={synthThinking ? 'scanning' : 'friendly'}
              size="sm"
            />
          </div>
        )}

        {/* Terminal Title */}
        <span className={`ml-2 font-mono text-sm ${synthMode ? 'text-neon-magenta synth-holographic' : 'text-neon-cyan'}`}>
          {synthMode ? 'SYNTH://conversation-mode' : 'terminal://devpulse/interactive'}
        </span>

        {/* Status Messages */}
        {synthMode && !synthThinking && (
          <span className="ml-auto text-neon-magenta font-mono text-xs animate-pulse synth-neon-pulse">
            [AI MODE ACTIVE]
          </span>
        )}
        {synthThinking && (
          <span className="ml-auto font-mono text-xs flex items-center gap-2">
            <span className="text-neon-magenta synth-glitch" data-text="[SYNTH ANALYZING...]">
              [SYNTH ANALYZING...]
            </span>
          </span>
        )}
        {isScanning && !synthMode && (
          <span className="ml-auto text-neon-green font-mono text-xs flex items-center gap-2">
            <span className="text-lg">{['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][spinnerFrame]}</span>
            <span>[SCANNING... {progress} items]</span>
          </span>
        )}
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalContainerRef}
        className="p-6 font-mono text-sm h-96 overflow-y-auto custom-scrollbar"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`mb-1 ${getLineColor(line.type)} whitespace-pre-wrap`}
            style={{ animation: 'fadeIn 0.2s ease-in' }}
          >
            {line.text}
          </div>
        ))}

        {/* Input line - Always visible, even during scans */}
        <div className={`flex items-center mt-2 ${synthMode ? 'text-neon-magenta' : 'text-neon-cyan'}`}>
          <span className="mr-2">{synthMode ? 'SYNTH >' : '>'}</span>
          <div className="flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={demoInputDisabled}
              className={`flex-1 bg-transparent outline-none ${
                synthMode
                  ? 'caret-neon-magenta text-neon-magenta'
                  : 'caret-neon-cyan text-neon-cyan'
              } ${demoInputDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              spellCheck={false}
              placeholder={
                demoInputDisabled
                  ? "Demo in progress..."
                  : synthMode
                  ? "Chat with SYNTH... (type 'exit' to leave)"
                  : isScanning
                  ? "Scan running... type 'game snake' to play"
                  : "Type command..."
              }
            />
            <span className={`inline-block w-2 h-4 animate-pulse ${synthMode ? 'bg-neon-magenta' : 'bg-neon-cyan'}`} />
          </div>
        </div>

        <div ref={terminalEndRef} />

        {/* Cache Indicator */}
        {resultsFromCache && (
          <div className="px-4 py-2 border-t border-neon-cyan/20 text-center">
            <span className="text-xs text-gray-500 font-mono">
              📦 Results from cache • Fresh scan running in background
            </span>
          </div>
        )}
      </div>

      {/* Initialization Overlay - "Press Any Key" */}
      {showInitOverlay && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-dark-bg/95 backdrop-blur-md"
          onClick={handleInitialize}
          onKeyDown={handleInitialize}
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <div className="text-center animate-pulse">
            <div className="text-4xl font-bold text-neon-cyan neon-text-cyan mb-4 font-mono">
              DEVPULSE TERMINAL
            </div>
            <div className="text-xl text-neon-green neon-text-green font-mono mb-8">
              v4.5 - SYNTH AI EDITION
            </div>
            <div className="text-lg text-gray-300 font-mono">
              [ CLICK TO INITIALIZE ]
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
})

InteractiveTerminal.displayName = 'InteractiveTerminal'

export default InteractiveTerminal
