'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { TrendingItem } from '@/lib/types'
import GameOverlay from './GameOverlay'

interface TerminalLine {
  id: string
  text: string
  type: 'input' | 'output' | 'success' | 'error' | 'progress'
  timestamp: number
}

interface InteractiveTerminalProps {
  onDataReceived: (items: TrendingItem[]) => void
  selectedSources: string[]
}

export default function InteractiveTerminal({ onDataReceived, selectedSources }: InteractiveTerminalProps) {
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
  const [activeGame, setActiveGame] = useState<'snake' | null>(null)
  const [showGamePrompt, setShowGamePrompt] = useState(false)
  const [scanCompleteNotification, setScanCompleteNotification] = useState(false)
  const [scanCompleteMessage, setScanCompleteMessage] = useState('')

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
      // Preload sounds
      Object.values(sounds.current).forEach(sound => {
        if (sound) {
          sound.volume = 0.3
          sound.load()
        }
      })
    }
  }, [])

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

  // Spinner animation - rotates through cool retro characters when scanning
  useEffect(() => {
    if (!isScanning) return

    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const interval = setInterval(() => {
      setSpinnerFrame(prev => (prev + 1) % spinnerFrames.length)
    }, 80) // Fast rotation for smooth animation

    return () => clearInterval(interval)
  }, [isScanning])

  // Auto-scan after boot sequence completes
  const [hasAutoScanned, setHasAutoScanned] = useState(false)

  // Initial boot sequence - only runs after user initializes system
  useEffect(() => {
    if (!isSystemReady || hasBooted.current) return // Don't run if not ready or already booted

    hasBooted.current = true // Mark as booted

    const bootLines = [
      { id: '1', text: '> DevPulse Terminal v2.0', type: 'output' as const, timestamp: Date.now() },
      { id: '2', text: '> Initializing systems...', type: 'output' as const, timestamp: Date.now() + 300 },
      { id: '3', text: '> [✓] GitHub API: ONLINE', type: 'success' as const, timestamp: Date.now() + 600 },
      { id: '4', text: '> [✓] Hacker News: ONLINE', type: 'success' as const, timestamp: Date.now() + 900 },
      { id: '5', text: '> [✓] Dev.to: ONLINE', type: 'success' as const, timestamp: Date.now() + 1200 },
      { id: '6', text: '> ', type: 'output' as const, timestamp: Date.now() + 1500 },
      { id: '7', text: '> Auto-scan initiating...', type: 'output' as const, timestamp: Date.now() + 1800 },
    ]

    bootLines.forEach((line, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, line])
        playBeep() // Audio is now unlocked, sounds will play!
      }, line.timestamp - Date.now())
    })

    // Trigger auto-scan after boot completes
    setTimeout(() => {
      setHasAutoScanned(true)
    }, 2500)
  }, [isSystemReady])

  // Play sound helper
  const playSound = (soundType: 'typing' | 'beep' | 'error' | 'success') => {
    if (!audioEnabled || !sounds.current[soundType]) return

    const sound = sounds.current[soundType]
    if (sound) {
      sound.currentTime = 0 // Reset to start
      sound.play().catch(() => {}) // Ignore errors
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

  // Handle command execution
  const executeCommand = async (command: string) => {
    const trimmed = command.trim().toLowerCase()

    // Add input line
    addLine(`> ${command}`, 'input')

    // Parse command
    const parts = trimmed.split(' ')
    const cmd = parts[0]
    const args = parts.slice(1)

    switch (cmd) {
      case 'help':
        playBeep()
        addLine('Available commands:', 'output')
        addLine('  scan [all|github|hackernews|devto] - Scan platforms for trending content', 'output')
        addLine('  scan github [language] - Scan GitHub for specific language', 'output')
        addLine('  jobs - Browse 100+ tech companies hiring', 'output')
        addLine('  jobs search [keyword] - Filter companies by keyword', 'output')
        addLine('  jobs [remote|visa|startup|intern] - Filter by category', 'output')
        addLine('  games - List available mini-games', 'output')
        addLine('  game [name] - Launch a mini-game (e.g., game snake)', 'output')
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
        addLine('  ', 'output')
        addLine('Usage: game [name] (e.g., "game snake")', 'output')
        addLine('Press ESC while playing to return to terminal', 'output')
        break

      case 'game':
        playBeep()
        if (args[0] === 'snake') {
          addLine('> Launching Snake...', 'success')
          setTimeout(() => setActiveGame('snake'), 300)
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

      case '':
        // Empty command, do nothing
        break

      default:
        playError()
        addLine(`Command not found: ${cmd}`, 'error')
        addLine('Type "help" for available commands', 'output')
    }
  }

  // Handle scan command
  const handleScan = async (args: string[]) => {
    setIsScanning(true)
    setProgress(0)
    itemsRef.current = []

    // Determine platform from args or selected sources
    let platform = args[0] || ''
    const language = args[1] || ''

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

    // Show game prompt after a short delay
    setTimeout(() => {
      setShowGamePrompt(true)
      addLine('  ', 'output')
      addLine('💡 Want to play a game while you wait? Type "game snake"', 'output')
      addLine('  ', 'output')
    }, 1500)

    try {
      // Connect to SSE endpoint (Render backend)
      const url = `https://devpulse-api.onrender.com/api/scan?platform=${platform}${language ? `&language=${language}` : ''}`
      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
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
            setProgress(prev => prev + 1)
            break

          case 'spider_complete':
            addLine(`> ${data.spider} scan complete`, 'success')
            playBeep()
            break

          case 'scan_complete':
            addLine('> ', 'output')
            addLine(`✓ Scan complete! Found ${data.total_items} items`, 'success')
            playSuccess()
            eventSource.close()
            setIsScanning(false)
            setShowGamePrompt(false)

            // ALWAYS show notification, then check if game is active
            console.log('Scan complete! activeGame:', activeGame)
            setScanCompleteNotification(true)
            setScanCompleteMessage(`Found ${data.total_items} trending items!`)

            // Send data to parent
            onDataReceived(itemsRef.current)
            break

          case 'error':
            addLine(`✗ Error: ${data.message}`, 'error')
            playError()
            break
        }
      }

      eventSource.onerror = () => {
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

  // Trigger auto-scan when flag is set
  useEffect(() => {
    if (hasAutoScanned && !isScanning) {
      handleScan([]) // Scan all platforms
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

      <div className="relative max-w-5xl mx-auto neon-border rounded-lg overflow-hidden bg-dark-card/90 backdrop-blur">
        {/* Terminal Header */}
      <div className="bg-dark-hover border-b border-neon-cyan/30 px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-magenta shadow-neon-magenta animate-pulse" />
        <div className="w-3 h-3 rounded-full bg-neon-green shadow-neon-green" />
        <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-neon-cyan" />
        <span className="ml-4 text-neon-cyan font-mono text-sm">terminal://devpulse/interactive</span>
        {isScanning && (
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
        <div className="flex items-center text-neon-cyan mt-2">
          <span className="mr-2">{'>'}</span>
          <div className="flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none caret-neon-cyan text-neon-cyan"
              spellCheck={false}
              placeholder={isScanning ? "Scan running... type 'game snake' to play" : "Type command..."}
            />
            <span className="inline-block w-2 h-4 bg-neon-cyan animate-pulse" />
          </div>
        </div>

        <div ref={terminalEndRef} />
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
              v2.0 - INITIALIZED
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
}
