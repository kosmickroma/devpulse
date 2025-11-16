'use client'

import { useState, useEffect, useRef } from 'react'

export default function OregonGame() {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro')
  const [miles, setMiles] = useState<number>(0)
  const [food, setFood] = useState<number>(500)
  const [health, setHealth] = useState<number>(100)
  const [day, setDay] = useState<number>(1)
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<'action'>('action')
  const terminalRef = useRef<HTMLDivElement>(null)

  const TOTAL_MILES = 2000

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    addOutput('OREGON - OREGON TRAIL SIMULATOR')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('YOU ARE TRAVELING THE OREGON TRAIL IN 1847.')
    addOutput(`YOUR GOAL: REACH OREGON (${TOTAL_MILES} MILES) ALIVE.`)
    addOutput('')
    addOutput('STARTING SUPPLIES:')
    addOutput('  Food: 500 lbs')
    addOutput('  Health: 100%')
    addOutput('')
    addOutput('Each day you must choose an action.')
    addOutput('Good luck, pioneer!')
    addOutput('')
    setGameState('playing')
    showStatus()
  }, [])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const showStatus = () => {
    addOutput(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    addOutput(`DAY ${day} | MILES: ${miles}/${TOTAL_MILES}`)
    addOutput(`FOOD: ${food} lbs | HEALTH: ${health}%`)
    addOutput(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    addOutput('')
    addOutput('WHAT WILL YOU DO?')
    addOutput('  TRAVEL - Move forward')
    addOutput('  REST - Recover health')
    addOutput('  HUNT - Get food')
    addOutput('  STATUS - Check supplies')
  }

  const handleInput = (value: string) => {
    const cmd = value.trim().toUpperCase()
    addOutput(`> ${value}`)

    if (cmd === 'TRAVEL') {
      travel()
    } else if (cmd === 'REST') {
      rest()
    } else if (cmd === 'HUNT') {
      hunt()
    } else if (cmd === 'STATUS') {
      showStatus()
    } else {
      addOutput('INVALID COMMAND. Try: TRAVEL, REST, HUNT, or STATUS')
    }
  }

  const travel = () => {
    const distance = 50 + Math.floor(Math.random() * 50) // 50-100 miles
    const newMiles = miles + distance
    const newFood = food - 20 - Math.floor(Math.random() * 10)
    const newHealth = Math.max(0, health - 5 - Math.floor(Math.random() * 10))

    setMiles(newMiles)
    setFood(newFood)
    setHealth(newHealth)
    setDay(day + 1)

    addOutput(`You traveled ${distance} miles.`)

    // Random events
    const event = Math.random()
    if (event < 0.1) {
      addOutput('⚡ THUNDERSTORM! Your supplies got wet.')
      setFood(Math.max(0, newFood - 30))
    } else if (event < 0.15) {
      addOutput('🐻 BEAR ATTACK! You escaped but lost supplies.')
      setFood(Math.max(0, newFood - 40))
      setHealth(Math.max(0, newHealth - 15))
    } else if (event < 0.2) {
      addOutput('🏔️ Found a shortcut through the mountains!')
      setMiles(newMiles + 30)
    }

    addOutput('')

    if (newMiles >= TOTAL_MILES) {
      winGame()
    } else if (newHealth <= 0) {
      loseGame('You died from exhaustion.')
    } else if (newFood <= 0) {
      loseGame('You starved to death.')
    } else {
      if (newFood < 50) {
        addOutput('⚠️ WARNING: Food running low!')
      }
      if (newHealth < 30) {
        addOutput('⚠️ WARNING: Health critical!')
      }
      addOutput('')
      showStatus()
    }
  }

  const rest = () => {
    const healthGain = 20 + Math.floor(Math.random() * 20)
    const newHealth = Math.min(100, health + healthGain)
    const newFood = food - 10

    setHealth(newHealth)
    setFood(newFood)
    setDay(day + 1)

    addOutput(`You rested for a day. Health +${healthGain}`)
    addOutput('')

    if (newFood <= 0) {
      loseGame('You starved while resting.')
    } else {
      showStatus()
    }
  }

  const hunt = () => {
    const success = Math.random() > 0.3
    const newFood = success ? food + 80 + Math.floor(Math.random() * 40) : food
    setFood(newFood)
    setDay(day + 1)

    if (success) {
      addOutput('🎯 SUCCESSFUL HUNT! You found food.')
    } else {
      addOutput('❌ Hunt failed. No food found.')
    }
    addOutput('')
    showStatus()
  }

  const winGame = () => {
    setGameState('ended')
    addOutput('')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('   🎉 YOU REACHED OREGON! 🎉')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('')
    addOutput(`Journey completed in ${day} days!`)
    addOutput(`Final health: ${health}%`)
    addOutput(`Final food: ${food} lbs`)
    addOutput('')
    if (day < 30 && health > 70) {
      addOutput('EXCELLENT JOURNEY! You\'re a true pioneer!')
    } else if (day < 45) {
      addOutput('Good job! You made it safely.')
    } else {
      addOutput('You made it, but it was rough!')
    }
    addOutput('')
    addOutput('Press ESC to exit.')
  }

  const loseGame = (reason: string) => {
    setGameState('ended')
    addOutput('')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('        GAME OVER')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('')
    addOutput(reason)
    addOutput(`You traveled ${miles} miles in ${day} days.`)
    addOutput('')
    addOutput('Better luck next time, pioneer!')
    addOutput('')
    addOutput('Press ESC to exit.')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleInput(currentInput)
      setCurrentInput('')
    }
  }

  return (
    <div className="w-full h-full bg-black p-6 overflow-hidden flex flex-col">
      <div className="mb-4 pb-2 border-b border-green-700">
        <h2 className="text-green-400 font-mono text-xl">OREGON - Trail Simulator</h2>
        <p className="text-green-600 text-sm">Original BASIC Program #71 (1978)</p>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm text-green-500 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-black"
      >
        {output.map((line, i) => (
          <div key={i} className={line.startsWith('>') ? 'text-green-300' : 'text-green-500'}>
            {line}
          </div>
        ))}
      </div>

      <div className="flex items-center border-t border-green-700 pt-2">
        <span className="text-yellow-500 mr-2">&gt;</span>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-transparent outline-none text-green-400 font-mono"
          placeholder="Enter command..."
          autoFocus
          disabled={gameState === 'ended'}
        />
      </div>

      <div className="mt-2 text-xs text-green-700 text-center">
        Day {day} | {miles}/{TOTAL_MILES} miles | Food: {food} | Health: {health}% | ESC to exit
      </div>
    </div>
  )
}
