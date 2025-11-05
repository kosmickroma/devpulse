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
  dx?: number
}

type PowerUp = {
  x: number
  y: number
  type: 'spread' | 'rapid' | 'shield' | 'laser'
  active: boolean
}

type UFO = {
  x: number
  y: number
  active: boolean
  direction: number
}

type Shield = {
  x: number
  y: number
  health: number
}

type Explosion = {
  x: number
  y: number
  frame: number
}

const GAME_WIDTH = 700
const GAME_HEIGHT = 600
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 30
const ALIEN_WIDTH = 35
const ALIEN_HEIGHT = 25

const ALIEN_POINTS = [50, 40, 30, 20, 10]
const ALIEN_COLORS = ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0066']

const FORMATIONS = [
  'standard',
  'vshape',
  'diamond',
  'columns',
  'waves',
  'chaos'
]

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
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null)
  const [powerUpTimer, setPowerUpTimer] = useState(0)
  const [ufo, setUfo] = useState<UFO | null>(null)
  const [shields, setShields] = useState<Shield[]>([])
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [alienDirection, setAlienDirection] = useState(1)
  const [alienSpeed, setAlienSpeed] = useState(1)
  const [hasShield, setHasShield] = useState(false)

  const gameLoopRef = useRef<number>()
  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const lastShotTime = useRef(0)
  const lastAlienShotTime = useRef(0)
  const alienMoveCounter = useRef(0)
  const lastUfoTime = useRef(0)

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

  const initShields = useCallback(() => {
    const shieldCount = 4
    const shieldSpacing = GAME_WIDTH / (shieldCount + 1)
    const newShields: Shield[] = []

    for (let i = 0; i < shieldCount; i++) {
      newShields.push({
        x: shieldSpacing * (i + 1) - 25,
        y: GAME_HEIGHT - 150,
        health: 10
      })
    }

    setShields(newShields)
  }, [])

  const getFormation = useCallback((waveNum: number, type: string) => {
    const aliens: Alien[] = []
    const baseOffsetX = 80
    const baseOffsetY = 60

    switch (type) {
      case 'vshape':
        for (let row = 0; row < 5; row++) {
          const cols = 11 - Math.abs(2 - row) * 2
          const offsetX = baseOffsetX + Math.abs(2 - row) * (ALIEN_WIDTH + 10)
          for (let col = 0; col < cols; col++) {
            aliens.push({
              x: offsetX + col * (ALIEN_WIDTH + 10),
              y: baseOffsetY + row * (ALIEN_HEIGHT + 10),
              type: row,
              alive: true
            })
          }
        }
        break

      case 'diamond':
        const diamondRows = [1, 3, 5, 3, 1]
        for (let row = 0; row < 5; row++) {
          const cols = diamondRows[row]
          const offsetX = baseOffsetX + (11 - cols) * (ALIEN_WIDTH + 10) / 2
          for (let col = 0; col < cols; col++) {
            aliens.push({
              x: offsetX + col * (ALIEN_WIDTH + 10),
              y: baseOffsetY + row * (ALIEN_HEIGHT + 10),
              type: row,
              alive: true
            })
          }
        }
        break

      case 'columns':
        for (let col = 0; col < 11; col++) {
          const height = (col % 2 === 0) ? 5 : 3
          for (let row = 0; row < height; row++) {
            aliens.push({
              x: baseOffsetX + col * (ALIEN_WIDTH + 10),
              y: baseOffsetY + row * (ALIEN_HEIGHT + 10),
              type: Math.floor(row / 2),
              alive: true
            })
          }
        }
        break

      case 'waves':
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 11; col++) {
            const waveOffset = Math.sin(col * 0.5) * 20
            aliens.push({
              x: baseOffsetX + col * (ALIEN_WIDTH + 10),
              y: baseOffsetY + row * (ALIEN_HEIGHT + 10) + waveOffset,
              type: row,
              alive: true
            })
          }
        }
        break

      case 'chaos':
        for (let i = 0; i < 50; i++) {
          aliens.push({
            x: baseOffsetX + Math.random() * 500,
            y: baseOffsetY + Math.random() * 200,
            type: Math.floor(Math.random() * 5),
            alive: true
          })
        }
        break

      default: // standard
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 11; col++) {
            aliens.push({
              x: baseOffsetX + col * (ALIEN_WIDTH + 10),
              y: baseOffsetY + row * (ALIEN_HEIGHT + 10),
              type: row,
              alive: true
            })
          }
        }
    }

    return aliens
  }, [])

  const initAliens = useCallback((waveNum: number) => {
    const formation = FORMATIONS[waveNum % FORMATIONS.length]
    const newAliens = getFormation(waveNum, formation)

    setAliens(newAliens)
    setAlienSpeed(1 + (waveNum - 1) * 0.2)
    setAlienDirection(1)
    alienMoveCounter.current = 0
  }, [getFormation])

  const startGame = useCallback(() => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLives(3)
    setWave(1)
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2)
    setBullets([])
    setPowerUps([])
    setActivePowerUp(null)
    setUfo(null)
    setExplosions([])
    setHasShield(false)
    initAliens(1)
    initShields()
    playSound(600, 0.2)
  }, [initAliens, initShields, playSound])

  const shoot = useCallback(() => {
    const now = Date.now()
    const cooldown = activePowerUp === 'rapid' ? 200 : 500

    if (now - lastShotTime.current > cooldown) {
      if (activePowerUp === 'spread') {
        setBullets(prev => [
          ...prev,
          { x: playerX + PLAYER_WIDTH / 2 - 2, y: GAME_HEIGHT - 50, isPlayerBullet: true, dx: 0 },
          { x: playerX + PLAYER_WIDTH / 2 - 2, y: GAME_HEIGHT - 50, isPlayerBullet: true, dx: -2 },
          { x: playerX + PLAYER_WIDTH / 2 - 2, y: GAME_HEIGHT - 50, isPlayerBullet: true, dx: 2 }
        ])
      } else if (activePowerUp === 'laser') {
        setBullets(prev => [
          ...prev,
          { x: playerX + PLAYER_WIDTH / 2 - 3, y: GAME_HEIGHT - 50, isPlayerBullet: true, dx: 0 }
        ])
      } else {
        setBullets(prev => [
          ...prev,
          { x: playerX + PLAYER_WIDTH / 2 - 2, y: GAME_HEIGHT - 50, isPlayerBullet: true, dx: 0 }
        ])
      }
      playSound(800, 0.1, 'square')
      lastShotTime.current = now
    }
  }, [playerX, activePowerUp, playSound])

  const spawnUfo = useCallback(() => {
    const now = Date.now()
    if (!ufo && now - lastUfoTime.current > 15000) {
      const direction = Math.random() > 0.5 ? 1 : -1
      setUfo({
        x: direction === 1 ? -50 : GAME_WIDTH + 50,
        y: 30,
        active: true,
        direction
      })
      lastUfoTime.current = now
      playSound(400, 0.3, 'sine')
    }
  }, [ufo, playSound])

  const addExplosion = useCallback((x: number, y: number) => {
    setExplosions(prev => [...prev, { x, y, frame: 0 }])
  }, [])

  const gameLoop = useCallback(() => {
    if (gameOver) return

    // Update explosions
    setExplosions(prev => prev.map(e => ({ ...e, frame: e.frame + 1 })).filter(e => e.frame < 10))

    // Spawn UFO randomly
    spawnUfo()

    // Move UFO
    if (ufo && ufo.active) {
      setUfo(prev => {
        if (!prev) return null
        const newX = prev.x + prev.direction * 3
        if (newX < -60 || newX > GAME_WIDTH + 60) {
          return null
        }
        return { ...prev, x: newX }
      })
    }

    // Move power-ups
    setPowerUps(prev => prev.map(p => ({ ...p, y: p.y + 2 })).filter(p => p.y < GAME_HEIGHT && p.active))

    // Check power-up collection
    setPowerUps(prev => {
      return prev.filter(powerUp => {
        if (
          powerUp.y >= GAME_HEIGHT - 50 &&
          powerUp.y <= GAME_HEIGHT - 20 &&
          powerUp.x >= playerX &&
          powerUp.x <= playerX + PLAYER_WIDTH
        ) {
          setActivePowerUp(powerUp.type)
          setPowerUpTimer(10000)
          if (powerUp.type === 'shield') {
            setHasShield(true)
          }
          playSound(1000, 0.2, 'square')
          return false
        }
        return true
      })
    })

    // Move bullets
    setBullets(prev => {
      return prev.map(bullet => ({
        ...bullet,
        x: bullet.x + (bullet.dx || 0),
        y: bullet.isPlayerBullet ? bullet.y - 8 : bullet.y + 5
      })).filter(bullet => bullet.y > 0 && bullet.y < GAME_HEIGHT && bullet.x > -10 && bullet.x < GAME_WIDTH + 10)
    })

    // Check bullet-shield collisions
    setBullets(prevBullets => {
      return prevBullets.filter(bullet => {
        for (let i = 0; i < shields.length; i++) {
          const shield = shields[i]
          if (shield.health > 0 &&
              bullet.x >= shield.x &&
              bullet.x <= shield.x + 50 &&
              bullet.y >= shield.y &&
              bullet.y <= shield.y + 30) {
            setShields(prev => prev.map((s, idx) =>
              idx === i ? { ...s, health: s.health - 1 } : s
            ))
            return false
          }
        }
        return true
      })
    })

    // Check UFO hits
    setBullets(prevBullets => {
      let bulletsToKeep = [...prevBullets]

      if (ufo && ufo.active) {
        bulletsToKeep = bulletsToKeep.filter(bullet => {
          if (!bullet.isPlayerBullet) return true

          if (
            bullet.x >= ufo.x &&
            bullet.x <= ufo.x + 50 &&
            bullet.y >= ufo.y &&
            bullet.y <= ufo.y + 20
          ) {
            const bonus = 200 + Math.floor(Math.random() * 300)
            setScore(prev => prev + bonus)
            addExplosion(ufo.x + 25, ufo.y + 10)
            setUfo(null)
            playSound(1200, 0.3, 'square')
            return false
          }
          return true
        })
      }

      return bulletsToKeep
    })

    // Check bullet-alien collisions
    setBullets(prevBullets => {
      let bulletsToKeep = [...prevBullets]

      setAliens(prevAliens => {
        let newAliens = [...prevAliens]

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
              addExplosion(alien.x + ALIEN_WIDTH / 2, alien.y + ALIEN_HEIGHT / 2)
              playSound(600 + alien.type * 50, 0.15, 'square')

              // Random power-up drop
              if (Math.random() < 0.15) {
                const types: ('spread' | 'rapid' | 'shield' | 'laser')[] = ['spread', 'rapid', 'shield', 'laser']
                setPowerUps(prev => [...prev, {
                  x: alien.x + ALIEN_WIDTH / 2,
                  y: alien.y + ALIEN_HEIGHT,
                  type: types[Math.floor(Math.random() * types.length)],
                  active: true
                }])
              }

              return activePowerUp === 'laser'
            }
          }
          return true
        })

        return newAliens
      })

      return bulletsToKeep
    })

    // Check if player hit
    if (!hasShield) {
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
          addExplosion(playerX + PLAYER_WIDTH / 2, GAME_HEIGHT - 35)
          return prevBullets.filter(b => b.isPlayerBullet)
        }

        return prevBullets
      })
    } else {
      setBullets(prev => prev.filter(b =>
        b.isPlayerBullet ||
        b.y < GAME_HEIGHT - 60 ||
        b.x < playerX ||
        b.x > playerX + PLAYER_WIDTH
      ))
    }

    // Move aliens
    alienMoveCounter.current += alienSpeed
    if (alienMoveCounter.current >= 60) {
      alienMoveCounter.current = 0

      setAliens(prevAliens => {
        let newAliens = [...prevAliens]
        const aliveAliens = newAliens.filter(a => a.alive)
        if (aliveAliens.length === 0) return newAliens

        let shouldMoveDown = false

        const leftmost = Math.min(...aliveAliens.map(a => a.x))
        const rightmost = Math.max(...aliveAliens.map(a => a.x + ALIEN_WIDTH))

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

        const lowestAlien = Math.max(...aliveAliens.map(a => a.y))
        if (lowestAlien >= GAME_HEIGHT - 100) {
          setGameOver(true)
          playSound(100, 0.5, 'sawtooth')
        }

        return newAliens
      })
    }

    // Aliens shoot
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

    // Check wave complete
    if (aliens.length > 0 && aliens.every(a => !a.alive)) {
      setWave(prev => {
        const newWave = prev + 1
        setTimeout(() => {
          initAliens(newWave)
          initShields()
        }, 1000)
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
  }, [aliens, alienDirection, alienSpeed, gameOver, playerX, shields, ufo, hasShield, activePowerUp, initAliens, initShields, playSound, spawnUfo, addExplosion])

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameStarted, gameOver, gameLoop])

  useEffect(() => {
    if (powerUpTimer > 0 && activePowerUp) {
      const interval = setInterval(() => {
        setPowerUpTimer(prev => {
          if (prev <= 100) {
            setActivePowerUp(null)
            setHasShield(false)
            return 0
          }
          return prev - 100
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [powerUpTimer, activePowerUp])

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

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'spread': return '⊕'
      case 'rapid': return '⚡'
      case 'shield': return '🛡️'
      case 'laser': return '◈'
      default: return '★'
    }
  }

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
          <span className="text-xs ml-2 opacity-70">{FORMATIONS[wave % FORMATIONS.length].toUpperCase()}</span>
        </div>
        <div className="text-neon-magenta">
          LIVES: {'❤️'.repeat(Math.max(0, lives))}
        </div>
      </div>

      <div className="w-full mb-2 flex justify-between items-center font-mono text-xs">
        <div className="text-neon-cyan/70">
          HIGH: <span className="text-neon-cyan font-bold">{highScore}</span>
        </div>
        {activePowerUp && (
          <div className="text-neon-green animate-pulse">
            ACTIVE: {activePowerUp.toUpperCase()} ({Math.ceil(powerUpTimer / 1000)}s)
          </div>
        )}
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
            <div className="text-lg text-neon-magenta mb-4 font-mono">ULTIMATE EDITION</div>
            <div className="text-sm text-gray-400 font-mono mb-8 text-center px-8">
              <div className="mb-2 text-neon-green">← → MOVE • SPACE SHOOT</div>
              <div className="text-xs text-gray-500 mt-4">
                🛸 UFO = 200-500pts • 💥 POWER-UPS • 🛡️ SHIELDS • 🎯 6 FORMATIONS
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
            {/* UFO */}
            {ufo && ufo.active && (
              <div
                className="absolute text-3xl"
                style={{
                  left: ufo.x,
                  top: ufo.y,
                  color: '#ff00ff',
                  textShadow: '0 0 20px #ff00ff',
                  filter: 'drop-shadow(0 0 10px #ff00ff)'
                }}
              >
                🛸
              </div>
            )}

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

            {/* Shields */}
            {shields.map((shield, i) => (
              shield.health > 0 && (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: shield.x,
                    top: shield.y,
                    width: 50,
                    height: 30,
                    background: `rgba(0, 255, 255, ${shield.health / 10})`,
                    border: `2px solid rgba(0, 255, 255, ${shield.health / 10})`,
                    boxShadow: `0 0 10px rgba(0, 255, 255, ${shield.health / 10})`,
                    borderRadius: '8px 8px 0 0'
                  }}
                />
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
              {hasShield && (
                <div
                  className="absolute -inset-2 rounded-full animate-pulse"
                  style={{
                    border: '2px solid #00ffff',
                    boxShadow: '0 0 20px #00ffff, inset 0 0 20px #00ffff'
                  }}
                />
              )}
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
                  width: activePowerUp === 'laser' && bullet.isPlayerBullet ? 6 : 4,
                  height: activePowerUp === 'laser' && bullet.isPlayerBullet ? 16 : 12,
                  background: bullet.isPlayerBullet ? (activePowerUp === 'laser' ? '#ff00ff' : '#00ffff') : '#ff0066',
                  boxShadow: bullet.isPlayerBullet ? '0 0 10px #00ffff' : '0 0 10px #ff0066',
                  borderRadius: '2px'
                }}
              />
            ))}

            {/* Power-ups */}
            {powerUps.map((powerUp, i) => (
              powerUp.active && (
                <div
                  key={i}
                  className="absolute text-2xl animate-pulse"
                  style={{
                    left: powerUp.x - 15,
                    top: powerUp.y,
                    color: '#00ff00',
                    textShadow: '0 0 10px #00ff00'
                  }}
                >
                  {getPowerUpIcon(powerUp.type)}
                </div>
              )
            ))}

            {/* Explosions */}
            {explosions.map((exp, i) => (
              <div
                key={i}
                className="absolute text-2xl font-bold"
                style={{
                  left: exp.x - 15,
                  top: exp.y - 15,
                  color: '#ff0066',
                  opacity: 1 - exp.frame / 10,
                  transform: `scale(${1 + exp.frame / 5})`,
                  textShadow: '0 0 20px #ff0066'
                }}
              >
                💥
              </div>
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
