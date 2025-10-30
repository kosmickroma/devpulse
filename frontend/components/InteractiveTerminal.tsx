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
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const terminalContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const itemsRef = useRef<TrendingItem[]>([])

  // Initialize audio on first user interaction
  const initializeAudio = () => {
    if (!audioEnabled && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioEnabled(true)
    }
  }

  // Auto-scroll within terminal container only (not the whole page)
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
    }
  }, [lines])

  // Initial boot sequence
  useEffect(() => {
    const bootLines = [
      { id: '1', text: '> DevPulse Terminal v1.1', type: 'output' as const, timestamp: Date.now() },
      { id: '2', text: '> Initializing systems...', type: 'output' as const, timestamp: Date.now() + 300 },
      { id: '3', text: '> [✓] GitHub API: ONLINE', type: 'success' as const, timestamp: Date.now() + 600 },
      { id: '4', text: '> [✓] Hacker News: ONLINE', type: 'success' as const, timestamp: Date.now() + 900 },
      { id: '5', text: '> [✓] Dev.to: ONLINE', type: 'success' as const, timestamp: Date.now() + 1200 },
      { id: '6', text: '> ', type: 'output' as const, timestamp: Date.now() + 1500 },
      { id: '7', text: '> Type "scan" to begin or "help" for commands', type: 'output' as const, timestamp: Date.now() + 1800 },
    ]

    bootLines.forEach((line, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, line])
        playBeep(200 + index * 50, 0.05)
      }, line.timestamp - Date.now())
    })
  }, [])

  // Play retro-style beep
  const playBeep = (frequency: number = 800, duration: number = 0.1) => {
    if (!audioContextRef.current || !audioEnabled) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'square' // Retro square wave

    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)

    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }

  // Play typing click
  const playTypingClick = () => {
    playBeep(1200, 0.02)
  }

  // Play error sound
  const playError = () => {
    playBeep(200, 0.3)
  }

  // Play success sound
  const playSuccess = () => {
    playBeep(600, 0.1)
    setTimeout(() => playBeep(800, 0.1), 100)
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
        playBeep(400, 0.1)
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
        playBeep(300, 0.1)
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

    playBeep(500, 0.1)
    addLine(`Initiating scan: ${platform}${language ? ` (${language})` : ''}...`, 'output')

    try {
      // Connect to SSE endpoint
      const url = `http://localhost:8000/api/scan?platform=${platform}${language ? `&language=${language}` : ''}`
      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'status':
            addLine(`> ${data.message}`, 'output')
            playBeep(400, 0.05)
            break

          case 'spider_start':
            addLine(`> Connecting to ${data.spider}...`, 'output')
            playBeep(500, 0.1)
            break

          case 'connecting':
            addLine(`> ${data.message}`, 'output')
            playBeep(450, 0.05)
            break

          case 'scanning':
            addLine(`> ${data.message}`, 'success')
            playBeep(600, 0.1)
            break

          case 'item':
            itemsRef.current.push(data.data)
            playBeep(700 + Math.random() * 200, 0.03) // Vary pitch slightly
            const item = data.data
            addLine(`  ✓ ${item.title.substring(0, 60)}...`, 'success')
            setProgress(prev => prev + 1)
            break

          case 'spider_complete':
            addLine(`> ${data.spider} scan complete`, 'success')
            playBeep(650, 0.15)
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
        addLine('✗ Connection error. Is the API server running?', 'error')
        addLine('  Run: python -m uvicorn api.main:app --reload', 'output')
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

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim() && !isScanning) {
      executeCommand(currentInput)
      setCurrentInput('')
    } else if (e.key.length === 1) {
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
    <div className="max-w-5xl mx-auto neon-border rounded-lg overflow-hidden bg-dark-card/90 backdrop-blur">
      {/* Terminal Header */}
      <div className="bg-dark-hover border-b border-neon-cyan/30 px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-magenta shadow-neon-magenta animate-pulse" />
        <div className="w-3 h-3 rounded-full bg-neon-green shadow-neon-green" />
        <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-neon-cyan" />
        <span className="ml-4 text-neon-cyan font-mono text-sm">terminal://devpulse/interactive</span>
        {!audioEnabled && (
          <span className="ml-auto text-yellow-400 font-mono text-xs animate-pulse">
            [Click terminal to enable audio]
          </span>
        )}
        {isScanning && (
          <span className="ml-auto text-neon-green font-mono text-xs animate-pulse">
            [SCANNING... {progress} items]
          </span>
        )}
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalContainerRef}
        className="p-6 font-mono text-sm h-96 overflow-y-auto custom-scrollbar"
        onClick={initializeAudio}
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
          <div className="flex items-center text-neon-cyan">
            <span className="mr-2">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none caret-neon-cyan"
              autoFocus
              spellCheck={false}
            />
            <span className="inline-block w-2 h-4 bg-neon-cyan animate-pulse ml-1" />
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  )
}
