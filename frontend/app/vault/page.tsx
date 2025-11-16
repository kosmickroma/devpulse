'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import GuessGame from '@/components/games/basic/GuessGame'
import AmazingGame from '@/components/games/basic/AmazingGame'
import StockGame from '@/components/games/basic/StockGame'
import OregonGame from '@/components/games/basic/OregonGame'
import StarTrekGame from '@/components/games/basic/StarTrekGame'

interface BasicProgram {
  id: string
  number: number
  title: string
  fullTitle: string
  description: string
  year: string
  status: 'restored' | 'locked' | 'corrupted'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
}

export default function VaultPage() {
  const router = useRouter()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectedProgram, setSelectedProgram] = useState<BasicProgram | null>(null)
  const [showCodeCompare, setShowCodeCompare] = useState(false)
  const [runningGame, setRunningGame] = useState<string | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const programs: BasicProgram[] = [
    {
      id: 'guess',
      number: 35,
      title: 'GUESS',
      fullTitle: 'Number Guessing Game',
      description: 'Classic number guessing game. The computer thinks of a number, you try to guess it. Simple logic, perfect for learning.',
      year: '1973',
      status: 'restored',
      difficulty: 'beginner',
      category: 'Game'
    },
    {
      id: 'amazing',
      number: 23,
      title: 'AMAZING',
      fullTitle: 'Maze Generator',
      description: 'Generates random ASCII mazes using depth-first search. A beautiful example of recursive algorithms from the 70s.',
      year: '1972',
      status: 'restored',
      difficulty: 'intermediate',
      category: 'Graphics'
    },
    {
      id: 'stock',
      number: 83,
      title: 'STOCK',
      fullTitle: 'Stock Market Simulation',
      description: 'Simulate stock market trading. Buy low, sell high, and try not to go bankrupt. Surprisingly relevant today.',
      year: '1976',
      status: 'restored',
      difficulty: 'intermediate',
      category: 'Simulation'
    },
    {
      id: 'oregon',
      number: 71,
      title: 'OREGON',
      fullTitle: 'Oregon Trail (Simplified)',
      description: 'Journey westward in this text-based adventure. Hunt for food, ford rivers, avoid dysentery. A classic.',
      year: '1978',
      status: 'restored',
      difficulty: 'intermediate',
      category: 'Adventure'
    },
    {
      id: 'startrek',
      number: 84,
      title: 'SUPER STAR TREK',
      fullTitle: 'Star Trek Space Combat',
      description: 'Command the Enterprise. Battle Klingons. The most complex game in the original BASIC collection.',
      year: '1974',
      status: 'restored',
      difficulty: 'advanced',
      category: 'Strategy'
    }
  ]

  const restoredCount = programs.filter(p => p.status === 'restored').length
  const totalCount = 104 // Total games in the original BASIC Computer Games book

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    setCommandHistory(prev => [...prev, cmd])
    setHistoryIndex(-1)

    let response = ''

    if (trimmed === 'help') {
      response = `
THE VAULT - AVAILABLE COMMANDS:
  list         - List all restored programs
  run [id]     - Run a program (e.g., run guess)
  compare [id] - View code comparison
  info [id]    - Show program information
  arcade       - Navigate to Arcade
  home         - Return to homepage
  clear        - Clear terminal
  ~            - Toggle fullscreen
  help         - Show this message
      `.trim()
    } else if (trimmed === 'list') {
      response = 'RESTORED PROGRAMS:\n\n' + programs
        .filter(p => p.status === 'restored')
        .map(p => `[#${p.number}] ${p.title} - ${p.fullTitle}`)
        .join('\n') +
        `\n\nProgress: ${restoredCount}/${totalCount} programs restored`
    } else if (trimmed.startsWith('info ')) {
      const programId = trimmed.slice(5).trim()
      const program = programs.find(p => p.id === programId || p.title.toLowerCase() === programId)
      if (program) {
        response = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PROGRAM #${program.number}: ${program.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${program.fullTitle}
Year: ${program.year}
Status: ${program.status.toUpperCase()}
Difficulty: ${program.difficulty}
Category: ${program.category}

${program.description}

Commands:
  run ${program.id}
  compare ${program.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim()
      } else {
        response = `Program "${programId}" not found. Type "list" to see available programs.`
      }
    } else if (trimmed.startsWith('run ')) {
      const programId = trimmed.slice(4).trim()
      const program = programs.find(p => p.id === programId || p.title.toLowerCase() === programId)
      if (program) {
        if (program.status === 'restored') {
          response = `> Initializing ${program.title}...\n> Loading from archive...\n> Program ready.`
          setTerminalHistory(prev => [...prev, `> ${cmd}`, response])
          setTimeout(() => setRunningGame(program.id), 500)
          return
        } else {
          response = `Error: Program #${program.number} is ${program.status}. Cannot execute.`
        }
      } else {
        response = `Program "${programId}" not found. Type "list" to see available programs.`
      }
    } else if (trimmed.startsWith('compare ')) {
      const programId = trimmed.slice(8).trim()
      const program = programs.find(p => p.id === programId || p.title.toLowerCase() === programId)
      if (program) {
        setSelectedProgram(program)
        setShowCodeCompare(true)
        response = `Opening code comparison for ${program.title}...`
      } else {
        response = `Program "${programId}" not found.`
      }
    } else if (trimmed === 'arcade') {
      router.push('/arcade')
      response = 'Navigating to Arcade...'
    } else if (trimmed === 'home') {
      router.push('/')
      response = 'Returning to homepage...'
    } else if (trimmed === 'clear') {
      setTerminalHistory([])
      return
    } else if (trimmed === '~') {
      setIsFullscreen(!isFullscreen)
      response = `Fullscreen ${!isFullscreen ? 'ENABLED' : 'DISABLED'}`
    } else if (trimmed === '') {
      return
    } else {
      response = `Command not found: ${cmd}. Type "help" for available commands.`
    }

    setTerminalHistory(prev => [...prev, `> ${cmd}`, response])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(terminalInput)
      setTerminalInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setTerminalInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setTerminalInput('')
        } else {
          setHistoryIndex(newIndex)
          setTerminalInput(commandHistory[newIndex])
        }
      }
    } else if (e.key === 'Escape') {
      if (showCodeCompare) {
        setShowCodeCompare(false)
      } else if (runningGame) {
        setRunningGame(null)
      }
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-green-400 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Old CRT glow effect */}
      <div className="fixed inset-0 bg-gradient-radial from-green-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Vintage scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 4px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-green-500 font-mono tracking-wider mb-1"
                style={{ textShadow: '0 0 10px rgba(34,197,94,0.7)' }}>
                📼 THE VAULT
              </h1>
              <p className="text-sm text-green-600">DEVPULSE ARCHIVES - BASIC COMPUTER GAMES COLLECTION</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-4 py-2 bg-green-900/30 border border-green-500 text-green-400 hover:bg-green-900/50 transition-colors font-mono"
              >
                {isFullscreen ? '⛶ EXIT' : '⛶ FULL'}
              </button>
              <button
                onClick={() => router.push('/arcade')}
                className="px-4 py-2 bg-purple-900/30 border border-purple-500 text-purple-400 hover:bg-purple-900/50 transition-colors font-mono"
              >
                🎮 ARCADE
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-cyan-900/30 border border-cyan-500 text-cyan-400 hover:bg-cyan-900/50 transition-colors font-mono"
              >
                🏠 HOME
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent" />
        </div>

        {/* Status bar */}
        <div className="mb-4 bg-green-950/30 border border-green-700/50 p-3 rounded font-mono text-sm">
          <div className="flex items-center justify-between">
            <div className="text-green-400">
              <span className="text-yellow-500">⚡</span> RESTORATION STATUS: {restoredCount}/{totalCount} PROGRAMS RECOVERED
            </div>
            <div className="text-green-600">
              ARCHIVE SOURCE: BASIC COMPUTER GAMES (1978)
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="mb-6 bg-black/90 border-2 border-green-500/50 p-4 rounded"
          style={{ boxShadow: '0 0 20px rgba(34,197,94,0.2), inset 0 0 40px rgba(0,0,0,0.8)' }}>
          <div
            ref={terminalRef}
            className="font-mono text-sm mb-3 h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-black"
          >
            {terminalHistory.length === 0 && (
              <div className="text-green-500/60">
                <div>DEVPULSE VAULT TERMINAL v1.0</div>
                <div>RECOVERED FROM: BASIC COMPUTER GAMES by David H. Ahl (1978)</div>
                <div className="mt-2">Type &quot;help&quot; for commands | Type &quot;list&quot; to see programs</div>
              </div>
            )}
            {terminalHistory.map((line, i) => (
              <div key={i} className={line.startsWith('>') ? 'text-green-400 font-bold' : 'text-green-500/80 whitespace-pre-wrap'}>
                {line}
              </div>
            ))}
          </div>
          <div className="flex items-center border-t border-green-700/30 pt-2">
            <span className="text-yellow-500 mr-2 font-mono">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-green-400 font-mono caret-green-400"
              placeholder="Enter command..."
              spellCheck={false}
            />
            <span className="text-green-600/30 text-xs ml-2">ESC: exit | ↑↓: history</span>
          </div>
        </div>

        {/* Program Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(program => (
            <div
              key={program.id}
              className={`relative bg-gradient-to-br from-gray-900/80 to-black/80 border-2 p-5 rounded transition-all duration-300 cursor-pointer ${
                program.status === 'restored'
                  ? 'border-green-500/50 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                  : 'border-gray-700/50 opacity-60'
              }`}
              onClick={() => program.status === 'restored' && setRunningGame(program.id)}
            >
              {/* Program Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="font-mono">
                  <div className="text-xs text-green-600">PROGRAM #{program.number.toString().padStart(3, '0')}</div>
                  <div className="text-xl font-bold text-green-400">{program.title}</div>
                </div>
                <div className={`px-2 py-1 text-xs font-mono border ${
                  program.status === 'restored'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                }`}>
                  {program.status === 'restored' ? '⚡ RESTORED' : '🔒 LOCKED'}
                </div>
              </div>

              <h3 className="text-sm text-gray-400 mb-3">{program.fullTitle}</h3>

              <p className="text-xs text-green-600/80 mb-4 leading-relaxed">
                {program.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">{program.year}</span>
                <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">{program.category}</span>
                <span className={`px-2 py-1 border rounded ${
                  program.difficulty === 'beginner' ? 'border-green-600 text-green-500' :
                  program.difficulty === 'intermediate' ? 'border-yellow-600 text-yellow-500' :
                  'border-red-600 text-red-500'
                }`}>
                  {program.difficulty}
                </span>
              </div>

              {program.status === 'restored' && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 bg-green-600 text-black font-mono text-sm font-bold hover:bg-green-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRunningGame(program.id)
                    }}
                  >
                    RUN
                  </button>
                  <button
                    className="flex-1 py-2 bg-gray-700 text-green-400 font-mono text-sm font-bold hover:bg-gray-600 transition-colors border border-green-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProgram(program)
                      setShowCodeCompare(true)
                    }}
                  >
                    COMPARE
                  </button>
                </div>
              )}

              <div className="mt-3 text-xs text-center text-green-700/50 font-mono">
                run {program.id} | compare {program.id}
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-gradient-to-r from-gray-900/40 to-black/40 border border-gray-700/50 p-6 rounded">
          <h3 className="text-lg font-mono text-gray-500 mb-2">🔒 {totalCount - restoredCount} PROGRAMS LOCKED</h3>
          <p className="text-sm text-gray-600">
            More programs are being restored from the archives. Check back soon for updates.
          </p>
        </div>
      </div>

      {/* Code Comparison Modal */}
      {showCodeCompare && selectedProgram && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-green-950/50 border-b border-green-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-mono text-green-400">
                CODE COMPARISON: {selectedProgram.title}
              </h3>
              <button
                onClick={() => setShowCodeCompare(false)}
                className="px-4 py-2 bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-900 transition-colors"
              >
                ESC - CLOSE
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <p className="text-green-600 mb-6">
                Compare the original 1970s BASIC implementation with our modern TypeScript version.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-green-500 font-mono mb-2 pb-2 border-b border-green-700">
                    ORIGINAL BASIC ({selectedProgram.year})
                  </h4>
                  <div className="bg-black p-4 rounded border border-green-900 font-mono text-xs text-green-400">
                    <div>10 PRINT &quot;COMING SOON&quot;</div>
                    <div>20 PRINT &quot;Original BASIC code will be displayed here&quot;</div>
                    <div>30 GOTO 10</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-cyan-500 font-mono mb-2 pb-2 border-b border-cyan-700">
                    DEVPULSE REMASTERED (2025)
                  </h4>
                  <div className="bg-black p-4 rounded border border-cyan-900 font-mono text-xs text-cyan-400">
                    <div><span className="text-purple-400">function</span> <span className="text-yellow-400">game</span>() {'{'}</div>
                    <div>  <span className="text-green-400">{'//'} Modern TypeScript implementation</span></div>
                    <div>  <span className="text-purple-400">console</span>.log(<span className="text-orange-400">&quot;Coming soon&quot;</span>)</div>
                    <div>{'}'}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-yellow-950/30 border border-yellow-700 p-4 rounded">
                <h4 className="text-yellow-500 font-mono mb-2">💡 WHAT CHANGED</h4>
                <ul className="text-sm text-yellow-600/80 space-y-1">
                  <li>• Line numbers removed (modern control flow)</li>
                  <li>• GOTO statements replaced with loops and functions</li>
                  <li>• Type safety with TypeScript</li>
                  <li>• Modern input/output handling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Running Modal */}
      {runningGame && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-green-950/50 border-b border-green-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-mono text-green-400">
                RUNNING: {programs.find(p => p.id === runningGame)?.title}
              </h3>
              <button
                onClick={() => setRunningGame(null)}
                className="px-4 py-2 bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-900 transition-colors"
              >
                ESC - EXIT
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-black">
              {runningGame === 'guess' && <GuessGame />}
              {runningGame === 'amazing' && <AmazingGame />}
              {runningGame === 'stock' && <StockGame />}
              {runningGame === 'oregon' && <OregonGame />}
              {runningGame === 'startrek' && <StarTrekGame />}
            </div>
          </div>
        </div>
      )}

      {/* CRT flicker effect */}
      <div className="fixed inset-0 pointer-events-none animate-flicker opacity-5 bg-white mix-blend-overlay" />
    </div>
  )
}
