'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

export default function StarTrekGame() {
  const [energy, setEnergy] = useState<number>(3000)
  const [torpedoes, setTorpedoes] = useState<number>(10)
  const [shields, setShields] = useState<number>(0)
  const [klingons, setKlingons] = useState<number>(3)
  const [klingonHealth, setKlingonHealth] = useState<number[]>([300, 300, 300])
  const [sector, setSector] = useState<number>(1)
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro')
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    addOutput('SUPER STAR TREK - SPACE COMBAT SIMULATION')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('YOU ARE CAPTAIN OF THE STARSHIP ENTERPRISE.')
    addOutput('YOUR MISSION: DESTROY ALL KLINGON BATTLE CRUISERS!')
    addOutput('')
    addOutput('STARTING STATUS:')
    addOutput('  Energy: 3000 units')
    addOutput('  Photon Torpedoes: 10')
    addOutput('  Enemy Klingons: 3')
    addOutput('')
    addOutput('Type HELP for commands')
    addOutput('')
    setGameState('playing')
    showStatus()
  }, [])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const showStatus = () => {
    addOutput(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    addOutput(`SECTOR ${sector} | KLINGONS: ${klingons}`)
    addOutput(`ENERGY: ${energy} | TORPEDOES: ${torpedoes}`)
    addOutput(`SHIELDS: ${shields}`)
    addOutput(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    if (klingons > 0) {
      addOutput('')
      addOutput('KLINGON BATTLE CRUISERS DETECTED:')
      klingonHealth.slice(0, klingons).forEach((health, i) => {
        if (health > 0) {
          addOutput(`  Klingon ${i + 1}: ${health} hull integrity`)
        }
      })
    }
    addOutput('')
  }

  const handleInput = (value: string) => {
    const parts = value.trim().toUpperCase().split(' ')
    const cmd = parts[0]
    const arg = parts[1] ? parseInt(parts[1]) : 0

    addOutput(`> ${value}`)

    if (cmd === 'HELP') {
      showHelp()
    } else if (cmd === 'STATUS') {
      showStatus()
    } else if (cmd === 'FIRE') {
      fireTorpedo(arg)
    } else if (cmd === 'SHIELDS') {
      adjustShields(arg)
    } else if (cmd === 'MOVE') {
      moveSector()
    } else {
      addOutput('UNKNOWN COMMAND. Type HELP for commands.')
    }
  }

  const showHelp = () => {
    addOutput('')
    addOutput('AVAILABLE COMMANDS:')
    addOutput('  FIRE [target] - Fire torpedo at Klingon (1-3)')
    addOutput('  SHIELDS [amount] - Transfer energy to shields')
    addOutput('  MOVE - Move to next sector')
    addOutput('  STATUS - Show current status')
    addOutput('  HELP - Show this message')
    addOutput('')
  }

  const fireTorpedo = (target: number) => {
    if (torpedoes <= 0) {
      addOutput('NO TORPEDOES REMAINING!')
      addOutput('')
      return
    }

    if (target < 1 || target > klingons) {
      addOutput('INVALID TARGET!')
      addOutput('')
      return
    }

    setTorpedoes(torpedoes - 1)

    const hit = Math.random() > 0.3
    if (hit) {
      const damage = 100 + Math.floor(Math.random() * 150)
      const newHealth = [...klingonHealth]
      newHealth[target - 1] = Math.max(0, newHealth[target - 1] - damage)
      setKlingonHealth(newHealth)

      addOutput(`🎯 DIRECT HIT! Klingon ${target} takes ${damage} damage!`)

      if (newHealth[target - 1] <= 0) {
        addOutput(`💥 KLINGON ${target} DESTROYED!`)
        const newKlingons = klingons - 1
        setKlingons(newKlingons)

        if (newKlingons === 0) {
          winGame()
          return
        }
      }
    } else {
      addOutput(`❌ TORPEDO MISSED!`)
    }

    addOutput('')
    klingonAttack()
  }

  const adjustShields = (amount: number) => {
    if (amount < 0 || amount > energy) {
      addOutput('INVALID ENERGY AMOUNT!')
      addOutput('')
      return
    }

    setShields(amount)
    addOutput(`Shields set to ${amount} units`)
    addOutput('')
    klingonAttack()
  }

  const moveSector = () => {
    const energyCost = 100
    if (energy < energyCost) {
      addOutput('INSUFFICIENT ENERGY TO MOVE!')
      addOutput('')
      return
    }

    setEnergy(energy - energyCost)
    setSector(sector + 1)
    addOutput(`Moving to sector ${sector + 1}...`)

    // Chance to encounter new Klingons
    if (Math.random() < 0.4 && klingons < 3) {
      const newKlingons = klingons + 1
      setKlingons(newKlingons)
      addOutput(`⚠️ NEW KLINGON DETECTED IN THIS SECTOR!`)
      const newHealth = [...klingonHealth]
      newHealth[newKlingons - 1] = 300
      setKlingonHealth(newHealth)
    }

    addOutput('')
    showStatus()
  }

  const klingonAttack = () => {
    if (klingons === 0) return

    addOutput('━━━ KLINGON ATTACK! ━━━')
    let totalDamage = 0

    klingonHealth.slice(0, klingons).forEach((health, i) => {
      if (health > 0) {
        const damage = 50 + Math.floor(Math.random() * 100)
        totalDamage += damage
        addOutput(`Klingon ${i + 1} fires phasers: ${damage} damage`)
      }
    })

    const shieldAbsorbed = Math.min(shields, totalDamage)
    const hullDamage = totalDamage - shieldAbsorbed

    if (shieldAbsorbed > 0) {
      addOutput(`Shields absorbed ${shieldAbsorbed} damage`)
      setShields(shields - shieldAbsorbed)
    }

    if (hullDamage > 0) {
      addOutput(`⚠️ Hull integrity damaged: ${hullDamage}`)
      setEnergy(energy - hullDamage)

      if (energy - hullDamage <= 0) {
        loseGame()
        return
      }
    }

    addOutput('')
  }

  const winGame = () => {
    setGameState('ended')
    addOutput('')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('   🌟 MISSION ACCOMPLISHED! 🌟')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('')
    addOutput('ALL KLINGON VESSELS DESTROYED!')
    addOutput(`Sectors explored: ${sector}`)
    addOutput(`Energy remaining: ${energy}`)
    addOutput(`Torpedoes remaining: ${torpedoes}`)
    addOutput('')
    addOutput('YOU HAVE SAVED THE FEDERATION!')
    addOutput('CAPTAIN KIRK WOULD BE PROUD.')
    addOutput('')
    addOutput('Press ESC to exit.')

    // Submit score: 1000 base + energy + torpedoes*50 + sectors*10
    const score = 1000 + energy + (torpedoes * 50) + (sector * 10)
    submitScore({
      gameId: 'startrek',
      score,
      metadata: {
        energy: energy,
        torpedoes: torpedoes,
        sectors: sector,
        won: true
      }
    }).catch(err => console.error('Failed to submit score:', err))
  }

  const loseGame = () => {
    setGameState('ended')
    addOutput('')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('      💀 GAME OVER 💀')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('')
    addOutput('THE ENTERPRISE HAS BEEN DESTROYED!')
    addOutput(`Klingons remaining: ${klingons}`)
    addOutput('')
    addOutput('The Federation mourns your loss.')
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
      <div className="mb-4 pb-2 border-b border-cyan-700">
        <h2 className="text-cyan-400 font-mono text-xl">SUPER STAR TREK</h2>
        <p className="text-cyan-600 text-sm">Original BASIC Program #84 (1974)</p>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm text-cyan-500 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-black"
      >
        {output.map((line, i) => (
          <div key={i} className={
            line.startsWith('>') ? 'text-cyan-300' :
            line.includes('⚠️') || line.includes('KLINGON') ? 'text-red-400' :
            line.includes('🎯') || line.includes('DESTROYED') ? 'text-yellow-400' :
            'text-cyan-500'
          }>
            {line}
          </div>
        ))}
      </div>

      <div className="flex items-center border-t border-cyan-700 pt-2">
        <span className="text-yellow-500 mr-2">&gt;</span>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-transparent outline-none text-cyan-400 font-mono"
          placeholder="Enter command..."
          autoFocus
          disabled={gameState === 'ended'}
        />
      </div>

      <div className="mt-2 text-xs text-cyan-700 text-center">
        Sector {sector} | Energy: {energy} | Torpedoes: {torpedoes} | Klingons: {klingons} | ESC to exit
      </div>
    </div>
  )
}
