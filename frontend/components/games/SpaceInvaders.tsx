'use client'

import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { GameNotificationContext } from '../GameOverlay'

type Alien = {
  x: number
  y: number
  type: number
  alive: boolean
}

type Bullet = {
  x: number
  y: number
  isPlayerBullet: boolean
}

const GAME_WIDTH = 700
const GAME_HEIGHT = 600
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 30
const ALIEN_WIDTH = 35
const ALIEN_HEIGHT = 25
const ALIEN_ROWS = 5
const ALIEN_COLS = 11

const ALIEN_POINTS = [50, 40, 30, 20, 10]
const ALIEN_COLORS = ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0066']

export default function SpaceInvaders() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2)
  const [aliens, setAliens] = useState<Alien[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [alienDirection, setAlienDirection] = useState(1)
  const [alienSpeed, setAlienSpeed] = useState(1)

  const gameLoopRef = useRef<number>()
  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const lastShotTime = useRef(0)
  const lastAlienShotTime = useRef(0)
  const alienMoveCounter = useRef(0)

  const { showNotification, notificationMessage } = useContext(GameNotificationContext)

  useEffect(() => {
    const saved = localStorage.getItem('spaceinvaders-highscore')
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
      // Audio not available
    }
  }, [])

  const initAliens = useCallback((waveNum: number) => {
    const newAliens: Alien[] = []
    const offsetX = 80
    const offsetY = 60

    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        newAliens.push({
          x: offsetX + col * (ALIEN_WIDTH + 10),
          y: offsetY + row * (ALIEN_HEIGHT + 10),
          type: row,
          alive: true
        })
      }
    }

    setAliens(newAliens)
    setAlienSpeed(1 + (waveNum - 1) * 0.3)
    setAlienDirection(1)
    alienMoveCounter.current = 0
  }, [])

  const startGame = useCallback(() => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLives(3)
    setWave(1)
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2)
    setBullets([])
    initAliens(1)
    playSound(600, 0.2)
  }, [initAliens, playSound])

  const shoot = useCallback(() => {
    const now = Date.now()
    if (now - lastShotTime.current > 500) {
      setBullets(prev => [...prev, {
        x: playerX + PLAYER_WIDTH / 2 - 2,
        y: GAME_HEIGHT - 50,
        isPlayerBullet: true
      }])
      playSound(800, 0.1, 'square')
      lastShotTime.current = now
    }
  }, [playerX, playSound])

  const gameLoop = useCallback(() => {
    if (gameOver) return

    // Move bullets
    setBullets(prev => {
      return prev.map(bullet => ({
        ...bullet,
        y: bullet.isPlayerBullet ? bullet.y - 8 : bullet.y + 5
      })).filter(bullet => bullet.y > 0 && bullet.y < GAME_HEIGHT)
    })

    // Check bullet collisions
    setBullets(prevBullets => {
      let bulletsToKeep = [...prevBullets]

      setAliens(prevAliens => {
        let newAliens = [...prevAliens]
        let hitOccurred = false

        bulletsToKeep = bulletsToKeep.filter(bullet => {
          if (!bullet.isPlayerBullet) return true

          for (let i = 0; i < newAliens.length; i++) {
            const alien = newAliens[i]
            if (!alien.alive) continue

            if (
              bullet.x >= alien.x &&
              bullet.x <= alien.x + ALIEN_WIDTH &&
              bullet.y >= alien.y &&
              bullet.y <= alien.y + ALIEN_HEIGHT
            ) {
              newAliens[i] = { ...alien, alive: false }
              setScore(prev => prev + ALIEN_POINTS[alien.type])
              playSound(600 + alien.type * 50, 0.15, 'square')
              hitOccurred = true
              return false
            }
          }
          return true
        })

        return newAliens
      })

      return bulletsToKeep
    })

    // Check if player hit by alien bullet
    setBullets(prevBullets => {
      const playerHit = prevBullets.some(bullet =>
        !bullet.isPlayerBullet &&
        bullet.x >= playerX &&
        bullet.x <= playerX + PLAYER_WIDTH &&
        bullet.y >= GAME_HEIGHT - 50 &&
        bullet.y <= GAME_HEIGHT - 20
      )

      if (playerHit) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameOver(true)
            playSound(100, 0.5, 'sawtooth')
          } else {
            playSound(200, 0.3, 'triangle')
          }
          return newLives
        })
        return prevBullets.filter(b => b.isPlayerBullet)
      }

      return prevBullets
    })

    // Move aliens
    alienMoveCounter.current += alienSpeed
    if (alienMoveCounter.current >= 60) {
      alienMoveCounter.current = 0

      setAliens(prevAliens => {
        let newAliens = [...prevAliens]
        let shouldMoveDown = false

        const leftmost = Math.min(...newAliens.filter(a => a.alive).map(a => a.x))
        const rightmost = Math.max(...newAliens.filter(a => a.alive).map(a => a.x + ALIEN_WIDTH))

        if ((alienDirection === 1 && rightmost >= GAME_WIDTH - 20) ||
            (alienDirection === -1 && leftmost <= 20)) {
          shouldMoveDown = true
          setAlienDirection(prev => -prev)
        }

        newAliens = newAliens.map(alien => ({
          ...alien,
          x: alien.x + (shouldMoveDown ? 0 : alienDirection * 15),
          y: alien.y + (shouldMoveDown ? 20 : 0)
        }))

        // Check if aliens reached bottom
        const lowestAlien = Math.max(...newAliens.filter(a => a.alive).map(a => a.y))
        if (lowestAlien >= GAME_HEIGHT - 100) {
          setGameOver(true)
          playSound(100, 0.5, 'sawtooth')
        }

        return newAliens
      })
    }

    // Aliens shoot randomly
    const now = Date.now()
    if (now - lastAlienShotTime.current > 1000) {
      const aliveAliens = aliens.filter(a => a.alive)
      if (aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)]
        setBullets(prev => [...prev, {
          x: shooter.x + ALIEN_WIDTH / 2,
          y: shooter.y + ALIEN_HEIGHT,
          isPlayerBullet: false
        }])
        playSound(300, 0.1, 'triangle')
        lastAlienShotTime.current = now
      }
    }

    // Check if all aliens dead (wave complete)
    if (aliens.length > 0 && aliens.every(a => !a.alive)) {
      setWave(prev => {
        const newWave = prev + 1
        initAliens(newWave)
        playSound(1000, 0.5, 'square')
        return newWave
      })
    }

    // Move player
    if (keysPressed.current['ArrowLeft']) {
      setPlayerX(prev => Math.max(0, prev - 6))
    }
    if (keysPressed.current['ArrowRight']) {
      setPlayerX(prev => Math.min(GAME_WIDTH - PLAYER_WIDTH, prev + 6))
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [aliens, alienDirection, alienSpeed, gameOver, playerX, initAliens, playSound])

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameStarted, gameOver, gameLoop])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        keysPressed.current[e.key] = true
      }
      if (e.key === ' ' && gameStarted && !gameOver) {
        e.preventDefault()
        shoot()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStarted, gameOver, shoot])

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score)
      localStorage.setItem('spaceinvaders-highscore', score.toString())
    }
  }, [gameOver, score, highScore])

  useEffect(() => {
    if (showNotification && notificationMessage) {
      playSound(1200, 0.3, 'sine')
    }
  }, [showNotification, notificationMessage, playSound])

  return (
    <div className="flex flex-col items-center justify-center p-4" style={{ width: `${GAME_WIDTH}px` }}>
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

      <div className="w-full mb-4 flex justify-between items-center font-mono text-sm">
        <div className="text-neon-cyan">
          SCORE: <span className="text-neon-magenta font-bold text-xl">{score}</span>
        </div>
        <div className="text-neon-green">
          WAVE: <span className="font-bold">{wave}</span>
        </div>
        <div className="text-neon-magenta">
          LIVES: {'❤️'.repeat(Math.max(0, lives))}
        </div>
      </div>

      <div className="w-full mb-2 flex justify-between items-center font-mono text-xs">
        <div className="text-neon-cyan/70">
          HIGH SCORE: <span className="text-neon-cyan font-bold">{highScore}</span>
        </div>
        <div className="text-gray-500">
          ALIENS: {aliens.filter(a => a.alive).length}
        </div>
      </div>

      <div
        className="relative border-2 border-neon-cyan rounded bg-black overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black via-dark-bg/50 to-black">
            <div className="text-5xl font-bold text-neon-cyan neon-text-cyan mb-4 font-mono tracking-wider">
              SPACE INVADERS
            </div>
            <div className="text-sm text-gray-400 font-mono mb-8 text-center px-8">
              <div className="mb-2 text-neon-green">← → MOVE SHIP</div>
              <div className="text-neon-magenta">SPACE: SHOOT</div>
            </div>
            <div className="mb-6 text-xs text-gray-500 font-mono text-center">
              <div className="flex gap-6 justify-center mb-2">
                <span style={{ color: ALIEN_COLORS[0] }}>▼ = 50pts</span>
                <span style={{ color: ALIEN_COLORS[1] }}>▼ = 40pts</span>
                <span style={{ color: ALIEN_COLORS[2] }}>▼ = 30pts</span>
              </div>
              <div className="flex gap-6 justify-center">
                <span style={{ color: ALIEN_COLORS[3] }}>▼ = 20pts</span>
                <span style={{ color: ALIEN_COLORS[4] }}>▼ = 10pts</span>
              </div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all active:scale-95"
            >
              START GAME
            </button>
          </div>
        ) : (
          <>
            {/* Aliens */}
            {aliens.map((alien, i) => (
              alien.alive && (
                <div
                  key={i}
                  className="absolute font-mono text-2xl flex items-center justify-center"
                  style={{
                    left: alien.x,
                    top: alien.y,
                    width: ALIEN_WIDTH,
                    height: ALIEN_HEIGHT,
                    color: ALIEN_COLORS[alien.type],
                    textShadow: `0 0 10px ${ALIEN_COLORS[alien.type]}`,
                    filter: `drop-shadow(0 0 5px ${ALIEN_COLORS[alien.type]})`
                  }}
                >
                  ▼
                </div>
              )
            ))}

            {/* Player */}
            <div
              className="absolute"
              style={{
                left: playerX,
                top: GAME_HEIGHT - 50,
                width: PLAYER_WIDTH,
                height: PLAYER_HEIGHT
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-neon-cyan" style={{ boxShadow: '0 0 10px #00ffff' }} />
                <div className="absolute top-3 left-0 w-full h-3 bg-gradient-to-t from-neon-cyan to-neon-magenta" style={{ boxShadow: '0 0 15px #00ffff' }} />
                <div className="absolute bottom-0 left-1 right-1 h-6 bg-neon-cyan" style={{ boxShadow: '0 0 20px #00ffff' }} />
              </div>
            </div>

            {/* Bullets */}
            {bullets.map((bullet, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: bullet.x,
                  top: bullet.y,
                  width: 4,
                  height: 12,
                  background: bullet.isPlayerBullet ? '#00ffff' : '#ff0066',
                  boxShadow: bullet.isPlayerBullet ? '0 0 10px #00ffff' : '0 0 10px #ff0066',
                  borderRadius: '2px'
                }}
              />
            ))}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-red-500 mb-4 font-mono">
                  GAME OVER
                </div>
                <div className="text-3xl text-neon-cyan mb-2 font-mono">
                  SCORE: {score}
                </div>
                <div className="text-xl text-neon-green mb-2 font-mono">
                  WAVE: {wave}
                </div>
                {score === highScore && score > 0 && (
                  <div className="text-lg text-neon-magenta mb-6 font-mono animate-pulse">
                    ⭐ NEW HIGH SCORE! ⭐
                  </div>
                )}
                <button
                  onClick={startGame}
                  className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all active:scale-95"
                >
                  PLAY AGAIN
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 font-mono text-center">
        Press ESC to return to terminal
      </div>
    </div>
  )
}
