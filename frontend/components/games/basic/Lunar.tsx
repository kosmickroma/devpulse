'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

export default function Lunar() {
  const [gameState, setGameState] = useState<'intro' | 'descending' | 'landed' | 'crashed'>('intro')
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  // Lander state
  const [altitude, setAltitude] = useState(100)    // Miles above surface
  const [velocity, setVelocity] = useState(1)       // Miles/second (positive = falling)
  const [fuel, setFuel] = useState(8000)           // Pounds
  const [time, setTime] = useState(0)              // Seconds elapsed
  const [lastBurn, setLastBurn] = useState(0)      // Last burn input

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
      }, 0)
    }
  }, [output])

  // Initialize game
  useEffect(() => {
    addOutput('LUNAR')
    addOutput('CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('')
    addOutput('THIS IS A COMPUTER SIMULATION OF AN APOLLO LUNAR')
    addOutput('LANDING CAPSULE.')
    addOutput('')
    addOutput('THE ON-BOARD COMPUTER HAS FAILED (IT WAS MADE BY')
    addOutput('XEROX) SO YOU HAVE TO LAND THE CAPSULE MANUALLY.')
    addOutput('')
    addOutput('SET BURN RATE OF RETRO ROCKETS TO ANY VALUE BETWEEN')
    addOutput('0 (FREE FALL) AND 200 (MAXIMUM BURN) POUNDS PER SECOND.')
    addOutput('SET BURN RATE EVERY 10 SECONDS.')
    addOutput('')
    addOutput('CAPSULE WEIGHT 32,500 LBS; FUEL WEIGHT 16,500 LBS.')
    addOutput('')
    addOutput('GOOD LUCK')
    addOutput('')
    addOutput('')
    startGame()
  }, [])

  // Submit score when landed
  useEffect(() => {
    if (gameState === 'landed') {
      // Score based on fuel remaining and landing smoothness
      const landingScore = Math.max(0, 1000 + (fuel * 0.5) - (velocity * 200))

      submitScore({
        gameId: 'lunar',
        score: Math.round(landingScore),
        metadata: {
          fuelRemaining: fuel,
          landingVelocity: velocity,
          timeElapsed: time,
          perfect: velocity <= 1
        }
      }).catch(err => console.error('Failed to submit score:', err))
    }
  }, [gameState, fuel, velocity, time])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const startGame = () => {
    setGameState('descending')
    showStatus()
  }

  const showStatus = () => {
    addOutput(`SEC    ALT      VEL      FUEL    BURN`)
    addOutput(`${String(time).padStart(3)}  ${String(altitude.toFixed(2)).padStart(7)}  ${String(velocity.toFixed(2)).padStart(7)}  ${String(fuel.toFixed(0)).padStart(7)}  ${String(lastBurn).padStart(6)}`)
    addOutput('')
  }

  const handleInput = (value: string) => {
    if (gameState !== 'descending') return

    const burnInput = value.trim().toUpperCase()

    // Allow 'K' for 'Thousands' shorthand (e.g., '5K' = 5000)
    let burnRate: number
    if (burnInput.endsWith('K')) {
      burnRate = parseFloat(burnInput.slice(0, -1)) * 1000
    } else {
      burnRate = parseFloat(burnInput)
    }

    if (isNaN(burnRate)) {
      addOutput(`> ${value}`)
      addOutput('PLEASE ENTER A NUMBER BETWEEN 0 AND 200')
      addOutput('')
      return
    }

    if (burnRate < 0 || burnRate > 200) {
      addOutput(`> ${value}`)
      addOutput('BURN RATE MUST BE BETWEEN 0 AND 200')
      addOutput('')
      return
    }

    if (burnRate > fuel) {
      addOutput(`> ${value}`)
      addOutput(`NOT ENOUGH FUEL! YOU ONLY HAVE ${fuel.toFixed(0)} LBS`)
      addOutput('')
      return
    }

    addOutput(`> ${value}`)
    addOutput('')
    setLastBurn(burnRate)

    // Simulate 10 seconds of flight
    simulateFlight(burnRate)
  }

  const simulateFlight = (burnRate: number) => {
    // Constants
    const GRAVITY = 0.001   // Lunar gravity
    const TIME_STEP = 10    // 10 seconds per burn input

    let newAltitude = altitude
    let newVelocity = velocity
    let newFuel = fuel
    let newTime = time

    // Simulate 10 seconds
    for (let i = 0; i < TIME_STEP; i++) {
      // Calculate thrust (burn creates upward acceleration)
      const thrust = (burnRate * 0.001) - GRAVITY

      // Update velocity (positive = falling down)
      newVelocity = newVelocity + GRAVITY - (burnRate * 0.001)

      // Update altitude
      newAltitude = newAltitude - newVelocity

      // Burn fuel
      newFuel = newFuel - burnRate

      newTime++

      // Check if landed or crashed during this second
      if (newAltitude <= 0) {
        newAltitude = 0
        break
      }

      // Check if out of fuel
      if (newFuel <= 0) {
        newFuel = 0
        burnRate = 0 // No more thrust
      }
    }

    // Update state
    setAltitude(newAltitude)
    setVelocity(newVelocity)
    setFuel(newFuel)
    setTime(newTime)

    // Check landing/crash
    if (newAltitude <= 0) {
      // Landed!
      const landingVelocity = Math.abs(newVelocity * 3600) // Convert to mph

      addOutput(`TOUCHDOWN AT ${newTime} SECONDS`)
      addOutput(`LANDING VELOCITY: ${landingVelocity.toFixed(1)} MPH`)
      addOutput(`FUEL LEFT: ${newFuel.toFixed(0)} LBS`)
      addOutput('')

      if (landingVelocity <= 1) {
        addOutput('PERFECT LANDING!')
        addOutput('YOU HAVE BEEN AWARDED THE LUNAR MODULE PILOT BADGE!')
        setGameState('landed')
      } else if (landingVelocity <= 10) {
        addOutput('GOOD LANDING (COULD BE BETTER)')
        setGameState('landed')
      } else if (landingVelocity <= 50) {
        addOutput('CRAFT DAMAGE... YOU\'RE STRANDED HERE UNTIL A RESCUE')
        addOutput('PARTY ARRIVES. HOPE YOU HAVE ENOUGH OXYGEN!')
        setGameState('crashed')
      } else {
        addOutput('***** CRASH *****')
        addOutput('SENSORS SHOW IMPACT OF ' + landingVelocity.toFixed(0) + ' MPH')
        addOutput('NOBODY COULD SURVIVE THAT... YOU JUST CREATED A NEW CRATER!')
        setGameState('crashed')
      }

      addOutput('')
      addOutput('PRESS ESC TO EXIT')
    } else {
      // Continue descent
      showStatus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleInput(currentInput)
      setCurrentInput('')
    } else if (e.key === 'Escape') {
      window.location.href = '/vault'
    }
  }

  return (
    <div className="w-full h-full bg-black p-6 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-2 border-b border-green-700">
        <h2 className="text-green-400 font-mono text-xl">LUNAR LANDER</h2>
        <p className="text-green-600 text-sm font-mono">Original BASIC Program #52 (1969)</p>
        <p className="text-green-700 text-xs font-mono mt-1">
          Land the Apollo capsule safely on the moon&apos;s surface
        </p>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm text-green-400 overflow-y-auto mb-4 whitespace-pre-wrap"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#22c55e #000000'
        }}
      >
        {output.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* Input */}
      {gameState === 'descending' && (
        <div className="flex items-center gap-2 border-t border-green-700 pt-2">
          <span className="text-yellow-500 font-mono">&gt;</span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent text-green-400 font-mono outline-none caret-green-400"
            placeholder="ENTER BURN RATE (0-200)"
            autoFocus
          />
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-2 text-xs text-green-700 text-center font-mono">
        {gameState === 'descending' && `ALT: ${altitude.toFixed(1)}mi | VEL: ${velocity.toFixed(2)}m/s | FUEL: ${fuel.toFixed(0)}lb`}
        {gameState === 'landed' && 'SUCCESSFUL LANDING ✓'}
        {gameState === 'crashed' && 'MISSION FAILED ✗'}
        {' | ESC to exit'}
      </div>
    </div>
  )
}

/*
ORIGINAL BASIC CODE (LUNAR.BAS - 1969):

10 PRINT TAB(34);"LUNAR"
20 PRINT TAB(15);"CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY"
30 PRINT:PRINT:PRINT
40 PRINT "THIS IS A COMPUTER SIMULATION OF AN APOLLO LUNAR"
50 PRINT "LANDING CAPSULE."
60 PRINT
70 PRINT "THE ON-BOARD COMPUTER HAS FAILED (IT WAS MADE BY"
80 PRINT "XEROX) SO YOU HAVE TO LAND THE CAPSULE MANUALLY."
90 PRINT
100 PRINT "SET BURN RATE OF RETRO ROCKETS TO ANY VALUE BETWEEN"
110 PRINT "0 (FREE FALL) AND 200 (MAXIMUM BURN) POUNDS PER SECOND."
120 PRINT "SET BURN RATE EVERY 10 SECONDS."
130 PRINT
140 PRINT "CAPSULE WEIGHT 32,500 LBS; FUEL WEIGHT 16,500 LBS."
150 PRINT
160 PRINT
200 PRINT "GOOD LUCK"
210 L=0
220 PRINT "SEC","MILE+FEET","MPH","LB FUEL","BURN RATE"
230 A=120
240 V=1
250 M=32500
260 N=16500
270 G=0.001
280 Z=1.8
290 PRINT L,INT(A);INT(500*(A-INT(A)));3600*V,M-N,
310 INPUT K
320 IF M-N<0.001 THEN 350
330 IF K<0 THEN 370
340 IF K>200 THEN 370
350 GOTO 380
370 PRINT "NOT POSSIBLE";
380 FOR I=1 TO 10
390 L=L+1
400 M=M-K
410 IF M-N<0.001 THEN 460
420 IF K>200 THEN 250
430 IF K<0 THEN 250
440 A=A-V
450 V=V+G*10-K*10/M
460 NEXT I
470 GOTO 290

(Simplified from original - Modernized with React state management,
removed GOTO statements, added better physics calculations)
*/
