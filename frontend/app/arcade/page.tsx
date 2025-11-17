'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SnakeGame from '@/components/games/SnakeGame'
import Minesweeper from '@/components/games/Minesweeper'
import GameOverlay from '@/components/GameOverlay'
import ArcadeLeaderboard from '@/components/ArcadeLeaderboard'
import BadgeUnlockPopup from '@/components/BadgeUnlockPopup'
import { checkNewBadges, type Badge } from '@/lib/arcade'

type GameType = 'snake' | 'minesweeper' | null

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
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null)
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
      id: 'minesweeper',
      title: 'MINESWEEPER',
      emoji: '💣',
      description: 'Neon minefield puzzle',
      highScore: 0,
      command: 'play mines'
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

  // Reload high scores when returning from a game
  useEffect(() => {
    if (!activeGame) {
      setGames(prevGames => prevGames.map(game => ({
        ...game,
        highScore: parseInt(localStorage.getItem(`${game.id}-highscore`) || '0')
      })))

      // Check for newly unlocked badges when returning from game
      checkForNewBadges()
    }
  }, [activeGame])

  // Check for new badges (called after games and on interval)
  const checkForNewBadges = async () => {
    console.log('[Badge Check] Checking for new badges...')
    const badges = await checkNewBadges()
    console.log('[Badge Check] Found badges:', badges)
    if (badges.length > 0) {
      console.log('[Badge Check] 🎖️ UNLOCKING BADGE:', badges[0])
      // Show the first new badge (they unlock one at a time typically)
      setUnlockedBadge(badges[0])
    }
  }

  // Poll for new badges every 10 seconds (catches Beta Explorer and other auto-grants)
  useEffect(() => {
    const interval = setInterval(checkForNewBadges, 10000)
    return () => clearInterval(interval)
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
  play [game]  - Launch a game (snake, mines)
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
        'mines': 'minesweeper',
        'minesweeper': 'minesweeper',
        'mine': 'minesweeper'
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-pulse drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]">
              ⚡ DEVPULSE ARCADE
            </h1>
            <p className="text-cyan-400/70 font-mono text-sm mt-2 tracking-widest">
              &gt; INSERT_COIN // PRESS_START // GET_READY
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-4 py-2 bg-yellow-600/20 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-600/40 transition-all duration-300 font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]"
            >
              🏆 LEADERBOARD
            </button>
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
              className="group relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-cyan-500/50 rounded-lg p-6 hover:border-purple-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
              onClick={() => launchGame(game.id)}
            >
              {/* Animated corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 group-hover:border-purple-400 transition-colors" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 group-hover:border-purple-400 transition-colors" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 group-hover:border-purple-400 transition-colors" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 group-hover:border-purple-400 transition-colors" />

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10">
                <div className="text-6xl mb-4 text-center group-hover:animate-bounce filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  {game.emoji}
                </div>
                <h3 className="text-xl font-bold font-mono text-cyan-400 mb-2 text-center group-hover:text-purple-400 transition-colors tracking-wider">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 text-center font-mono">
                  {game.description}
                </p>
                <div className="text-center mb-4 bg-black/50 border border-cyan-500/30 rounded p-2">
                  <div className="text-xs text-cyan-500/60 mb-1 font-mono">HIGH SCORE</div>
                  <div className="text-2xl font-bold font-mono text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">{game.highScore.toLocaleString()}</div>
                </div>
                <button
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold font-mono hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] relative overflow-hidden group/btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    launchGame(game.id)
                  }}
                >
                  <span className="relative z-10">▶ PLAY</span>
                  <div className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300" />
                </button>
                <div className="text-xs text-center text-cyan-500/40 mt-2 font-mono">
                  &gt; {game.command}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vault Promo */}
        <div className="mt-12 relative bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500 p-8 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.4)]">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold font-mono text-purple-400 mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                📼 THE VAULT
              </h3>
              <p className="text-gray-300 font-mono text-sm">
                &gt; EXPLORE RESTORED BASIC GAMES FROM 1978<br/>
                &gt; CODING ARCHAEOLOGY AWAITS...
              </p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 font-mono">7 GAMES</span>
                <span className="text-xs px-2 py-1 bg-yellow-500/20 border border-yellow-500 text-yellow-400 font-mono">AUTHENTIC CODE</span>
                <span className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500 text-purple-400 font-mono">CLASSIC</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/vault')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-purple-400 text-white font-bold font-mono hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.9)] transform hover:scale-105"
            >
              ▶ ENTER THE VAULT
            </button>
          </div>
        </div>
      </div>

      {/* Game Overlay */}
      {activeGame && (
        <GameOverlay
          game={activeGame === 'snake' ? 'snake' : 'minesweeper'}
          onClose={() => setActiveGame(null)}
        />
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <ArcadeLeaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Badge Unlock Popup */}
      <BadgeUnlockPopup
        badge={unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
      />

      {/* Scanlines effect */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />
    </div>
  )
}
