'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { TrendingItem } from '@/lib/types'

interface TerminalLine {
  id: string
  text: string
  type: 'input' | 'output' | 'success' | 'error' | 'progress'
  timestamp: number
}

interface InteractiveTerminalProps {
  onDataReceived: (items: TrendingItem[]) => void
}

export default function InteractiveTerminal({ onDataReceived }: InteractiveTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isSystemReady, setIsSystemReady] = useState(false)
  const [showInitOverlay, setShowInitOverlay] = useState(true)
  const [spinnerFrame, setSpinnerFrame] = useState(0) // NEW: for loading animation
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
      { id: '1', text: '> DevPulse Terminal v1.1', type: 'output' as const, timestamp: Date.now() },
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
        addLine('  clear - Clear terminal', 'output')
        addLine('  help - Show this help message', 'output')
        break

      case 'scan':
        await handleScan(args)
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

    const platform = args[0] || 'all'
    const language = args[1] || ''

    playBeep()
    addLine(`Initiating scan: ${platform}${language ? ` (${language})` : ''}...`, 'output')

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
    if (e.key === 'Enter' && currentInput.trim() && !isScanning) {
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

        {/* Input line */}
        {!isScanning && (
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
                placeholder="Type command..."
              />
              <span className="inline-block w-2 h-4 bg-neon-cyan animate-pulse" />
            </div>
          </div>
        )}

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
              v1.1 - INITIALIZED
            </div>
            <div className="text-lg text-gray-300 font-mono mb-2">
              [ CLICK TO INITIALIZE ]
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Boot sequence will begin with audio
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
