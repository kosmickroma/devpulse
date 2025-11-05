'use client'

import { useState, useEffect, useCallback, useContext } from 'react'
import { GameNotificationContext } from '../GameOverlay'

type Cell = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
  x: number
  y: number
}

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
}

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [grid, setGrid] = useState<Cell[][]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const [minesLeft, setMinesLeft] = useState(0)
  const [time, setTime] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  const { showNotification, notificationMessage } = useContext(GameNotificationContext)

  const config = DIFFICULTIES[difficulty]

  useEffect(() => {
    const saved = localStorage.getItem('minesweeper-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
    } catch (e) {
      // Audio context not available
    }
  }, [])

  const initGrid = useCallback((excludeX?: number, excludeY?: number) => {
    const newGrid: Cell[][] = []

    for (let y = 0; y < config.rows; y++) {
      const row: Cell[] = []
      for (let x = 0; x < config.cols; x++) {
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
          x,
          y
        })
      }
      newGrid.push(row)
    }

    let minesPlaced = 0
    while (minesPlaced < config.mines) {
      const x = Math.floor(Math.random() * config.cols)
      const y = Math.floor(Math.random() * config.rows)

      if (excludeX !== undefined && excludeY !== undefined) {
        const isNearFirstClick = Math.abs(x - excludeX) <= 1 && Math.abs(y - excludeY) <= 1
        if (isNearFirstClick) continue
      }

      if (!newGrid[y][x].isMine) {
        newGrid[y][x].isMine = true
        minesPlaced++
      }
    }

    for (let y = 0; y < config.rows; y++) {
      for (let x = 0; x < config.cols; x++) {
        if (!newGrid[y][x].isMine) {
          let count = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy
              const nx = x + dx
              if (ny >= 0 && ny < config.rows && nx >= 0 && nx < config.cols) {
                if (newGrid[ny][nx].isMine) count++
              }
            }
          }
          newGrid[y][x].neighborMines = count
        }
      }
    }

    return newGrid
  }, [config.rows, config.cols, config.mines])

  const revealCell = useCallback((grid: Cell[][], x: number, y: number): Cell[][] => {
    if (y < 0 || y >= config.rows || x < 0 || x >= config.cols) return grid
    if (grid[y][x].isRevealed || grid[y][x].isFlagged) return grid

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
    newGrid[y][x].isRevealed = true

    if (newGrid[y][x].neighborMines === 0 && !newGrid[y][x].isMine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            newGrid.splice(0, newGrid.length, ...revealCell(newGrid, x + dx, y + dy))
          }
        }
      }
    }

    return newGrid
  }, [config.rows, config.cols])

  const handleCellClick = useCallback((x: number, y: number) => {
    if (gameOver || gameWon) return

    if (firstClick) {
      const newGrid = initGrid(x, y)
      setGrid(newGrid)
      setFirstClick(false)
      setGameStarted(true)
      const revealed = revealCell(newGrid, x, y)
      setGrid(revealed)
      playSound(600, 0.1)
      return
    }

    if (grid[y][x].isFlagged) return

    if (flagMode) {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
      newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged
      setGrid(newGrid)
      setMinesLeft(prev => newGrid[y][x].isFlagged ? prev - 1 : prev + 1)
      playSound(400, 0.1, 'square')
      return
    }

    if (grid[y][x].isRevealed) return

    if (grid[y][x].isMine) {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine || cell.isRevealed })))
      setGrid(newGrid)
      setGameOver(true)
      setGameStarted(false)
      playSound(100, 0.5, 'sawtooth')
      return
    }

    const newGrid = revealCell(grid, x, y)
    setGrid(newGrid)
    playSound(600, 0.1)

    const revealedCount = newGrid.flat().filter(c => c.isRevealed && !c.isMine).length
    const totalSafeCells = config.rows * config.cols - config.mines

    if (revealedCount === totalSafeCells) {
      setGameWon(true)
      setGameStarted(false)

      const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
      const finalScore = Math.max(1000 - time, 100) * difficultyMultiplier
      setScore(finalScore)

      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('minesweeper-highscore', finalScore.toString())
      }

      playSound(1000, 0.5, 'square')
    }
  }, [grid, gameOver, gameWon, flagMode, firstClick, initGrid, revealCell, playSound, time, difficulty, config.rows, config.cols, config.mines, highScore])

  const startNewGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff)
    const config = DIFFICULTIES[diff]
    setGrid([])
    setGameStarted(false)
    setGameOver(false)
    setGameWon(false)
    setFlagMode(false)
    setMinesLeft(config.mines)
    setTime(0)
    setFirstClick(true)
    setScore(0)
  }, [])

  useEffect(() => {
    if (gameStarted) {
      const interval = setInterval(() => {
        setTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameStarted])

  useEffect(() => {
    if (showNotification && notificationMessage) {
      playSound(1200, 0.3, 'sine')
    }
  }, [showNotification, notificationMessage, playSound])

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) return 'bg-dark-card border-neon-cyan/30'
    if (cell.isMine) return 'bg-red-900/50 border-red-500'

    const colors = [
      'text-gray-500',
      'text-blue-400',
      'text-green-400',
      'text-red-400',
      'text-purple-400',
      'text-orange-400',
      'text-cyan-400',
      'text-pink-400',
      'text-yellow-400'
    ]

    return `bg-dark-bg/50 border-neon-cyan/10 ${cell.neighborMines > 0 ? colors[cell.neighborMines] : ''}`
  }

  const cellSize = config.cols > 20 ? 'w-5 h-5 text-[10px]' : config.cols > 12 ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
  const maxWidth = config.cols > 20 ? 'max-w-[650px]' : config.cols > 12 ? 'max-w-[500px]' : 'max-w-[350px]'

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {showNotification && notificationMessage && (
        <div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 bg-neon-green/20 border-2 border-neon-green rounded neon-border"
          style={{
            animation: 'neon-flicker 0.3s ease-in-out 6, glow-pulse 2s ease-in-out infinite 2s'
          }}
        >
          <div className="text-neon-green font-bold font-mono text-2xl">
            SCAN COMPLETE
          </div>
          <div className="text-neon-green/80 font-mono text-sm mt-1">
            {notificationMessage}
          </div>
        </div>
      )}

      <div className={`w-full ${maxWidth} mb-4`}>
        <div className="flex justify-between items-center font-mono text-sm mb-2">
          <div className="text-neon-cyan">
            💣 MINES: <span className="text-neon-magenta font-bold">{minesLeft}</span>
          </div>
          <div className="text-neon-green">
            ⏱️ TIME: <span className="font-bold">{time}s</span>
          </div>
        </div>

        <div className="flex justify-between items-center font-mono text-xs mb-4">
          <div className="text-neon-cyan">
            SCORE: <span className="text-neon-magenta font-bold">{score}</span>
          </div>
          <div className="text-neon-green">
            HIGH: <span className="font-bold">{highScore}</span>
          </div>
        </div>

        {!gameStarted && !gameOver && !gameWon && (
          <div className="mb-4 text-center">
            <div className="text-2xl font-bold text-neon-magenta neon-text-magenta mb-4 font-mono">
              MINESWEEPER
            </div>
            <div className="text-sm text-gray-400 font-mono mb-4">
              SELECT DIFFICULTY
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => startNewGame('easy')}
                className="px-4 py-2 border-2 border-neon-green text-neon-green rounded font-mono font-bold hover:bg-neon-green/10 transition-all"
              >
                EASY
                <div className="text-xs opacity-70">9x9 • 10</div>
              </button>
              <button
                onClick={() => startNewGame('medium')}
                className="px-4 py-2 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all"
              >
                MEDIUM
                <div className="text-xs opacity-70">16x16 • 40</div>
              </button>
              <button
                onClick={() => startNewGame('hard')}
                className="px-4 py-2 border-2 border-neon-magenta text-neon-magenta rounded font-mono font-bold hover:bg-neon-magenta/10 transition-all"
              >
                HARD
                <div className="text-xs opacity-70">16x30 • 99</div>
              </button>
            </div>
          </div>
        )}

        {(gameStarted || gameOver || gameWon) && (
          <>
            <div className="mb-2 flex gap-2 justify-center">
              <button
                onClick={() => setFlagMode(!flagMode)}
                className={`px-4 py-1 border-2 rounded font-mono text-xs font-bold transition-all ${
                  flagMode
                    ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/20'
                    : 'border-neon-cyan/50 text-neon-cyan/50 hover:border-neon-cyan hover:text-neon-cyan'
                }`}
              >
                🚩 FLAG MODE {flagMode ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => startNewGame(difficulty)}
                className="px-4 py-1 border-2 border-neon-green/50 text-neon-green/50 hover:border-neon-green hover:text-neon-green rounded font-mono text-xs font-bold transition-all"
              >
                NEW GAME
              </button>
            </div>

            <div className="relative border-2 border-neon-cyan rounded bg-dark-bg/90 p-2">
              <div className="flex flex-col gap-[2px]">
                {grid.map((row, y) => (
                  <div key={y} className="flex gap-[2px]">
                    {row.map((cell, x) => (
                      <button
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (!gameOver && !gameWon && gameStarted) {
                            const newGrid = grid.map(row => row.map(c => ({ ...c })))
                            newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged
                            setGrid(newGrid)
                            setMinesLeft(prev => newGrid[y][x].isFlagged ? prev - 1 : prev + 1)
                            playSound(400, 0.1, 'square')
                          }
                        }}
                        className={`
                          ${cellSize}
                          border
                          font-mono font-bold
                          flex items-center justify-center
                          transition-all
                          hover:brightness-125
                          active:scale-95
                          ${getCellColor(cell)}
                        `}
                        disabled={gameOver || gameWon}
                      >
                        {cell.isFlagged && !cell.isRevealed && '🚩'}
                        {cell.isRevealed && cell.isMine && '💣'}
                        {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && cell.neighborMines}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {gameOver && (
                <div className="absolute inset-0 bg-dark-bg/90 flex flex-col items-center justify-center rounded">
                  <div className="text-4xl font-bold text-red-500 mb-4 font-mono">
                    💥 GAME OVER
                  </div>
                  <button
                    onClick={() => startNewGame(difficulty)}
                    className="px-6 py-2 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all"
                  >
                    TRY AGAIN
                  </button>
                </div>
              )}

              {gameWon && (
                <div className="absolute inset-0 bg-dark-bg/90 flex flex-col items-center justify-center rounded">
                  <div className="text-4xl font-bold text-neon-green neon-text-green mb-2 font-mono">
                    🎉 VICTORY!
                  </div>
                  <div className="text-2xl text-neon-cyan mb-2 font-mono">
                    SCORE: {score}
                  </div>
                  <div className="text-lg text-neon-magenta mb-4 font-mono">
                    TIME: {time}s
                  </div>
                  {score === highScore && score > 0 && (
                    <div className="text-sm text-neon-green mb-4 font-mono animate-pulse">
                      ⭐ NEW HIGH SCORE! ⭐
                    </div>
                  )}
                  <button
                    onClick={() => startNewGame(difficulty)}
                    className="px-6 py-2 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all"
                  >
                    PLAY AGAIN
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 font-mono text-center">
        <div>LEFT CLICK: Reveal • RIGHT CLICK: Flag</div>
        <div className="mt-1">Press ESC to return to terminal</div>
      </div>
    </div>
  )
}
