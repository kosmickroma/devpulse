'use client'

import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { GameNotificationContext } from '../GameOverlay'

interface Brick {
  x: number
  y: number
  width: number
  height: number
  hits: number
  color: string
  powerUp?: string
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
}

interface PowerUp {
  x: number
  y: number
  type: string
  active: boolean
}

const GAME_WIDTH = 600
const GAME_HEIGHT = 700
const PADDLE_WIDTH = 100
const PADDLE_HEIGHT = 15
const BALL_RADIUS = 8
const BRICK_ROWS = 5
const BRICK_COLS = 10
const BRICK_WIDTH = 55
const BRICK_HEIGHT = 20
const BRICK_PADDING = 3
const BRICK_OFFSET_Y = 120

const POWER_UP_TYPES = ['multiball', 'extend', 'laser', 'slowmo', 'catch', 'life']
const COLORS = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0066', '#00ffaa']

export default function BrickBreaker() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [combo, setCombo] = useState(0)
  const [paddle, setPaddle] = useState({ x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH })
  const [balls, setBalls] = useState<Ball[]>([])
  const [bricks, setBricks] = useState<Brick[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [activePowerUps, setActivePowerUps] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [hasLaser, setHasLaser] = useState(false)
  const [catchActive, setCatchActive] = useState(false)
  const [caughtBall, setCaughtBall] = useState<number | null>(null)

  const gameLoopRef = useRef<number>()
  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const comboTimerRef = useRef<NodeJS.Timeout>()

  const { showNotification, notificationMessage } = useContext(GameNotificationContext)

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  }, [])

  const initLevel = useCallback((levelNum: number) => {
    const newBricks: Brick[] = []
    const offsetX = (GAME_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING))) / 2

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        if (levelNum === 1 || Math.random() > 0.1) {
          const hits = Math.min(levelNum, 3)
          newBricks.push({
            x: offsetX + col * (BRICK_WIDTH + BRICK_PADDING),
            y: BRICK_OFFSET_Y + row * (BRICK_HEIGHT + BRICK_PADDING),
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            hits,
            color: COLORS[hits - 1],
            powerUp: Math.random() < 0.08 ? POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)] : undefined
          })
        }
      }
    }

    setBricks(newBricks)
    setBalls([{
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 100,
      dx: 3 + levelNum * 0.5,
      dy: -(3 + levelNum * 0.5),
      radius: BALL_RADIUS
    }])
    setPowerUps([])
    setActivePowerUps([])
    setHasLaser(false)
    setCatchActive(false)
    setCaughtBall(null)
  }, [])

  useEffect(() => {
    if (gameStarted && !gameOver) {
      initLevel(level)
    }
  }, [level, gameStarted, gameOver, initLevel])

  const activatePowerUp = useCallback((type: string) => {
    playSound(800, 0.2, 'square')

    switch (type) {
      case 'multiball':
        setBalls(prev => {
          const newBalls = [...prev]
          prev.forEach(ball => {
            newBalls.push({ ...ball, dx: ball.dx * 1.2, dy: -Math.abs(ball.dy) })
            newBalls.push({ ...ball, dx: -ball.dx * 1.2, dy: -Math.abs(ball.dy) })
          })
          return newBalls
        })
        break
      case 'extend':
        setPaddle(prev => ({ ...prev, width: Math.min(prev.width + 40, 200) }))
        setTimeout(() => setPaddle(prev => ({ ...prev, width: PADDLE_WIDTH })), 10000)
        break
      case 'laser':
        setHasLaser(true)
        setTimeout(() => setHasLaser(false), 8000)
        break
      case 'slowmo':
        setBalls(prev => prev.map(ball => ({ ...ball, dx: ball.dx * 0.5, dy: ball.dy * 0.5 })))
        setTimeout(() => {
          setBalls(prev => prev.map(ball => ({ ...ball, dx: ball.dx * 2, dy: ball.dy * 2 })))
        }, 8000)
        break
      case 'catch':
        setCatchActive(true)
        setTimeout(() => setCatchActive(false), 10000)
        break
      case 'life':
        setLives(prev => prev + 1)
        break
    }

    setActivePowerUps(prev => [...prev, type])
    setTimeout(() => {
      setActivePowerUps(prev => prev.filter(p => p !== type))
    }, 10000)
  }, [playSound])

  const gameLoop = useCallback(() => {
    if (isPaused || gameOver) return

    setBalls(prevBalls => {
      let updatedBalls = prevBalls.map((ball, ballIndex) => {
        if (caughtBall === ballIndex) {
          return { ...ball, x: paddle.x + paddle.width / 2, y: GAME_HEIGHT - 100 }
        }

        let newX = ball.x + ball.dx
        let newY = ball.y + ball.dy
        let newDx = ball.dx
        let newDy = ball.dy

        if (newX - ball.radius < 0 || newX + ball.radius > GAME_WIDTH) {
          newDx = -newDx
          playSound(300, 0.1)
        }
        if (newY - ball.radius < 0) {
          newDy = -newDy
          playSound(300, 0.1)
        }

        if (newY + ball.radius > GAME_HEIGHT) {
          if (prevBalls.length === 1) {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameOver(true)
                playSound(100, 0.5, 'sawtooth')
              } else {
                playSound(200, 0.3, 'triangle')
                setTimeout(() => {
                  setBalls([{
                    x: GAME_WIDTH / 2,
                    y: GAME_HEIGHT - 100,
                    dx: 3 + level * 0.5,
                    dy: -(3 + level * 0.5),
                    radius: BALL_RADIUS
                  }])
                }, 500)
              }
              return newLives
            })
            return null
          }
          return null
        }

        if (
          newY + ball.radius >= GAME_HEIGHT - 100 &&
          newY + ball.radius <= GAME_HEIGHT - 85 &&
          newX >= paddle.x &&
          newX <= paddle.x + paddle.width
        ) {
          if (catchActive) {
            setCaughtBall(ballIndex)
            return { ...ball, x: newX, y: GAME_HEIGHT - 100, dx: 0, dy: 0 }
          }

          const hitPos = (newX - paddle.x) / paddle.width
          const angle = (hitPos - 0.5) * Math.PI / 3
          const speed = Math.sqrt(newDx * newDx + newDy * newDy)
          newDx = speed * Math.sin(angle)
          newDy = -Math.abs(speed * Math.cos(angle))
          playSound(400, 0.1)
        }

        setBricks(prevBricks => {
          let brickHit = false
          const updatedBricks = prevBricks.map(brick => {
            if (
              !brickHit &&
              newX + ball.radius > brick.x &&
              newX - ball.radius < brick.x + brick.width &&
              newY + ball.radius > brick.y &&
              newY - ball.radius < brick.y + brick.height
            ) {
              brickHit = true

              if (newX < brick.x || newX > brick.x + brick.width) {
                newDx = -newDx
              } else {
                newDy = -newDy
              }

              const newHits = brick.hits - 1
              playSound(600 + newHits * 100, 0.15, 'square')

              if (newHits <= 0) {
                setScore(prev => prev + (10 * level * (combo + 1)))
                setCombo(prev => prev + 1)

                if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
                comboTimerRef.current = setTimeout(() => setCombo(0), 2000)

                if (brick.powerUp) {
                  setPowerUps(prev => [...prev, {
                    x: brick.x + brick.width / 2,
                    y: brick.y + brick.height,
                    type: brick.powerUp!,
                    active: true
                  }])
                }

                return null
              }

              return { ...brick, hits: newHits, color: COLORS[newHits - 1] }
            }
            return brick
          }).filter(Boolean) as Brick[]

          if (updatedBricks.length === 0) {
            setLevel(prev => prev + 1)
            playSound(1000, 0.5, 'square')
          }

          return updatedBricks
        })

        return { ...ball, x: newX, y: newY, dx: newDx, dy: newDy }
      }).filter(Boolean) as Ball[]

      return updatedBalls
    })

    setPowerUps(prev => prev.map(powerUp => {
      const newY = powerUp.y + 2

      if (
        newY >= GAME_HEIGHT - 100 &&
        newY <= GAME_HEIGHT - 85 &&
        powerUp.x >= paddle.x &&
        powerUp.x <= paddle.x + paddle.width
      ) {
        activatePowerUp(powerUp.type)
        return { ...powerUp, active: false }
      }

      if (newY > GAME_HEIGHT) {
        return { ...powerUp, active: false }
      }

      return { ...powerUp, y: newY }
    }).filter(p => p.active))

    if (keysPressed.current['ArrowLeft']) {
      setPaddle(prev => ({ ...prev, x: Math.max(0, prev.x - 8) }))
      if (caughtBall !== null) {
        setBalls(prev => prev.map((ball, i) =>
          i === caughtBall ? { ...ball, x: Math.max(0, ball.x - 8) } : ball
        ))
      }
    }
    if (keysPressed.current['ArrowRight']) {
      setPaddle(prev => ({ ...prev, x: Math.min(GAME_WIDTH - prev.width, prev.x + 8) }))
      if (caughtBall !== null) {
        setBalls(prev => prev.map((ball, i) =>
          i === caughtBall ? { ...ball, x: Math.min(GAME_WIDTH, ball.x + 8) } : ball
        ))
      }
    }
    // Space bar handling moved to keydown event to prevent issues

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [paddle, level, combo, isPaused, gameOver, caughtBall, catchActive, playSound, activatePowerUp])

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
      if (e.key === ' ') {
        e.preventDefault()
        if (caughtBall !== null) {
          setBalls(prev => prev.map((ball, i) =>
            i === caughtBall ? { ...ball, dx: 3 + level * 0.5, dy: -(3 + level * 0.5) } : ball
          ))
          setCaughtBall(null)
        }
      }
      if (e.key === 'p') {
        setIsPaused(prev => !prev)
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
  }, [caughtBall, level])

  useEffect(() => {
    if (showNotification && notificationMessage) {
      playSound(1200, 0.3, 'sine')
    }
  }, [showNotification, notificationMessage, playSound])

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setLives(3)
    setCombo(0)
    setPaddle({ x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH })
    playSound(600, 0.2)
  }

  const POWER_UP_LABELS: { [key: string]: string } = {
    multiball: 'MULTI',
    extend: 'EXTEND',
    laser: 'LASER',
    slowmo: 'SLOW',
    catch: 'CATCH',
    life: 'LIFE'
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
          SCORE: <span className="text-neon-magenta font-bold">{score}</span>
          {combo > 0 && <span className="text-neon-green ml-2">x{combo + 1}</span>}
        </div>
        <div className="text-neon-green">LEVEL: {level}</div>
        <div className="text-neon-magenta">
          LIVES: {'❤️'.repeat(Math.max(0, lives))}
        </div>
      </div>

      {activePowerUps.length > 0 && (
        <div className="w-full mb-2 flex gap-2 justify-center">
          {activePowerUps.map((powerUp, i) => (
            <span key={i} className="text-xs font-mono px-2 py-1 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan rounded">
              {POWER_UP_LABELS[powerUp]}
            </span>
          ))}
        </div>
      )}

      <div
        className="relative border-2 border-neon-cyan rounded bg-dark-bg/90"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-neon-magenta neon-text-magenta mb-4 font-mono">
              BRICK BREAKER
            </div>
            <div className="text-sm text-gray-400 font-mono mb-8 text-center px-8">
              <div>← → MOVE PADDLE</div>
              <div>SPACE: RELEASE BALL</div>
              <div>P: PAUSE</div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all"
            >
              START GAME
            </button>
          </div>
        ) : (
          <>
            {bricks.map((brick, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: brick.x,
                  top: brick.y,
                  width: brick.width,
                  height: brick.height,
                  background: brick.color,
                  boxShadow: `0 0 10px ${brick.color}`,
                  border: `1px solid ${brick.color}`
                }}
              />
            ))}

            {balls.map((ball, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: ball.x - ball.radius,
                  top: ball.y - ball.radius,
                  width: ball.radius * 2,
                  height: ball.radius * 2,
                  background: '#fff',
                  boxShadow: '0 0 15px #fff, 0 0 30px #00ffff'
                }}
              />
            ))}

            <div
              className="absolute"
              style={{
                left: paddle.x,
                top: GAME_HEIGHT - 100,
                width: paddle.width,
                height: PADDLE_HEIGHT,
                background: 'linear-gradient(180deg, #00ffff, #0088ff)',
                boxShadow: '0 0 20px #00ffff',
                border: '2px solid #00ffff',
                borderRadius: '4px'
              }}
            />

            {powerUps.map((powerUp, i) => (
              <div
                key={i}
                className="absolute font-mono text-xs font-bold flex items-center justify-center"
                style={{
                  left: powerUp.x - 20,
                  top: powerUp.y,
                  width: 40,
                  height: 20,
                  background: '#ff00ff',
                  border: '2px solid #ff00ff',
                  boxShadow: '0 0 10px #ff00ff',
                  color: '#fff',
                  borderRadius: '4px'
                }}
              >
                {POWER_UP_LABELS[powerUp.type]}
              </div>
            ))}

            {isPaused && (
              <div className="absolute inset-0 bg-dark-bg/80 flex items-center justify-center">
                <div className="text-4xl font-bold text-neon-cyan neon-text-cyan font-mono">
                  PAUSED
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-dark-bg/90 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-neon-magenta neon-text-magenta mb-4 font-mono">
                  GAME OVER
                </div>
                <div className="text-2xl text-neon-cyan mb-2 font-mono">
                  FINAL SCORE: {score}
                </div>
                <div className="text-lg text-neon-green mb-8 font-mono">
                  LEVEL REACHED: {level}
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan rounded font-mono font-bold hover:bg-neon-cyan/10 transition-all"
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
