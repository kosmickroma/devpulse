'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SnakeGame from '@/components/games/SnakeGame'
import SpaceInvaders from '@/components/games/SpaceInvaders'
import Minesweeper from '@/components/games/Minesweeper'
import BrickBreaker from '@/components/games/BrickBreaker'
import GameOverlay from '@/components/GameOverlay'

type GameType = 'snake' | 'spaceinvaders' | 'minesweeper' | 'brickbreaker' | null

interface GameCardData {
  id: GameType
  title: string
  emoji: string
  description: string
  highScore: number
  command: string
}

export default function ArcadePage() {
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<GameType>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [games, setGames] = useState<GameCardData[]>([
    {
      id: 'snake',
      title: 'SNAKE',
      emoji: '🐍',
      description: 'Classic snake with neon vibes',
      highScore: 0,
      command: 'play snake'
    },
    {
      id: 'spaceinvaders',
      title: 'SPACE INVADERS',
      emoji: '👾',
      description: 'Defend Earth from alien invasion',
      highScore: 0,
      command: 'play space'
    },
    {
      id: 'minesweeper',
      title: 'MINESWEEPER',
      emoji: '💣',
      description: 'Neon minefield puzzle',
      highScore: 0,
      command: 'play mines'
    },
    {
      id: 'brickbreaker',
      title: 'BRICK BREAKER',
      emoji: '🧱',
      description: 'Arkanoid-style brick breaking',
      highScore: 0,
      command: 'play brick'
    }
  ])
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load high scores from localStorage on client side
  useEffect(() => {
    setGames(prevGames => prevGames.map(game => ({
      ...game,
      highScore: parseInt(localStorage.getItem(`${game.id}-highscore`) || '0')
    })))
  }, [])

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
Available commands:
  play [game]  - Launch a game (snake, space, mines, brick)
  games        - List all games
  scores       - Show high scores
  vault        - Navigate to The Vault
  home         - Return to homepage
  clear        - Clear terminal
  ~            - Toggle fullscreen
  help         - Show this message
      `.trim()
    } else if (trimmed === 'games') {
      response = games.map(g => `${g.emoji} ${g.title} - ${g.command}`).join('\n')
    } else if (trimmed === 'scores') {
      response = 'HIGH SCORES:\n' + games.map(g =>
        `${g.emoji} ${g.title.padEnd(20)} ${g.highScore.toString().padStart(8)}`
      ).join('\n')
    } else if (trimmed === 'vault') {
      router.push('/vault')
      response = 'Navigating to The Vault...'
    } else if (trimmed === 'home') {
      router.push('/')
      response = 'Returning to homepage...'
    } else if (trimmed === 'clear') {
      setTerminalHistory([])
      return
    } else if (trimmed === '~') {
      setIsFullscreen(!isFullscreen)
      response = `Fullscreen ${!isFullscreen ? 'ENABLED' : 'DISABLED'}`
    } else if (trimmed.startsWith('play ')) {
      const gameName = trimmed.slice(5).trim()
      const gameMap: { [key: string]: GameType } = {
        'snake': 'snake',
        'space': 'spaceinvaders',
        'spaceinvaders': 'spaceinvaders',
        'invaders': 'spaceinvaders',
        'mines': 'minesweeper',
        'minesweeper': 'minesweeper',
        'mine': 'minesweeper',
        'brick': 'brickbreaker',
        'brickbreaker': 'brickbreaker',
        'breaker': 'brickbreaker'
      }

      const gameId = gameMap[gameName]
      if (gameId) {
        response = `> Launching ${gameName.toUpperCase()}...`
        setTerminalHistory(prev => [...prev, `> ${cmd}`, response])
        setTimeout(() => setActiveGame(gameId), 300)
        return
      } else {
        response = `Game "${gameName}" not found. Type "games" to see available games.`
      }
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
    }
  }

  const launchGame = (gameId: GameType) => {
    setActiveGame(gameId)
  }

  return (
    <div className={`min-h-screen bg-black text-cyan-400 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Retro grid background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-pulse">
            DEVPULSE ARCADE
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-4 py-2 bg-purple-600/20 border border-purple-500 text-purple-400 hover:bg-purple-600/40 transition-colors"
            >
              {isFullscreen ? '⛶ EXIT FULLSCREEN' : '⛶ FULLSCREEN'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-cyan-600/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-600/40 transition-colors"
            >
              🏠 HOME
            </button>
          </div>
        </div>

        {/* Terminal */}
        <div className="mb-6 bg-black/80 border border-cyan-500 p-4 rounded shadow-[0_0_20px_rgba(0,255,255,0.3)]">
          <div
            ref={terminalRef}
            className="font-mono text-sm mb-2 h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-black"
          >
            {terminalHistory.length === 0 && (
              <div className="text-cyan-500/60">
                DEVPULSE ARCADE v1.0.0 - Type &quot;help&quot; for commands
              </div>
            )}
            {terminalHistory.map((line, i) => (
              <div key={i} className={line.startsWith('>') ? 'text-cyan-400' : 'text-green-400'}>
                {line}
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <span className="text-purple-500 mr-2">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-cyan-400 font-mono"
              placeholder="Type a command..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map(game => (
            <div
              key={game.id}
              className="group bg-black/60 border-2 border-cyan-500/50 rounded-lg p-6 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => launchGame(game.id)}
            >
              <div className="text-6xl mb-4 text-center group-hover:animate-bounce">
                {game.emoji}
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-2 text-center group-hover:text-purple-400 transition-colors">
                {game.title}
              </h3>
              <p className="text-sm text-gray-400 mb-4 text-center">
                {game.description}
              </p>
              <div className="text-center mb-4">
                <div className="text-xs text-cyan-500/60 mb-1">HIGH SCORE</div>
                <div className="text-2xl font-bold text-yellow-400">{game.highScore}</div>
              </div>
              <button
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation()
                  launchGame(game.id)
                }}
              >
                PLAY
              </button>
              <div className="text-xs text-center text-cyan-500/40 mt-2 font-mono">
                {game.command}
              </div>
            </div>
          ))}
        </div>

        {/* Vault Promo */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-purple-400 mb-2">📼 THE VAULT</h3>
              <p className="text-gray-400">Explore restored BASIC games from 1978. Coding archaeology awaits.</p>
            </div>
            <button
              onClick={() => router.push('/vault')}
              className="px-6 py-3 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              ENTER THE VAULT
            </button>
          </div>
        </div>
      </div>

      {/* Game Overlay */}
      {activeGame && activeGame !== 'brickbreaker' && (
        <GameOverlay
          game={activeGame === 'snake' ? 'snake' : activeGame === 'spaceinvaders' ? 'spaceinvaders' : 'minesweeper'}
          onClose={() => setActiveGame(null)}
        />
      )}

      {/* BrickBreaker Modal (doesn't use GameOverlay) */}
      {activeGame === 'brickbreaker' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setActiveGame(null)} />
          <div className="relative z-10 w-full max-w-6xl h-[95vh] flex flex-col bg-black border-2 border-cyan-500 rounded-lg">
            <div className="flex justify-between items-center bg-gray-900/90 p-2 border-b border-cyan-500/30">
              <div className="text-cyan-400 font-mono text-sm">🎮 BRICK BREAKER</div>
              <button
                onClick={() => setActiveGame(null)}
                className="px-3 py-1 border border-purple-500 bg-purple-900/50 text-purple-400 hover:bg-purple-900 transition-colors"
              >
                ESC
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <BrickBreaker />
            </div>
          </div>
        </div>
      )}

      {/* Scanlines effect */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />
    </div>
  )
}
