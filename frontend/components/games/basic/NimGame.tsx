'use client'

import { useState, useEffect, useRef } from 'react'

export default function NimGame() {
  const [piles, setPiles] = useState<number[]>([7, 5, 3])
  const [gameState, setGameState] = useState<'intro' | 'player' | 'computer' | 'ended'>('intro')
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const [selectedPile, setSelectedPile] = useState<number | null>(null)
  const [playerWins, setPlayerWins] = useState<number>(0)
  const [computerWins, setComputerWins] = useState<number>(0)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    addOutput('NIM - MATHEMATICAL STRATEGY GAME')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('NIM IS A GAME OF STRATEGY AND GAME THEORY.')
    addOutput('')
    addOutput('RULES:')
    addOutput('  - There are 3 piles of objects')
    addOutput('  - Players take turns removing objects')
    addOutput('  - On your turn, remove 1 or more from ONE pile')
    addOutput('  - The player who takes the LAST object LOSES')
    addOutput('')
    addOutput('THIS GAME TEACHES:')
    addOutput('  * Optimal strategy (Nim-sum/XOR)')
    addOutput('  * Game theory fundamentals')
    addOutput('  * Binary number systems')
    addOutput('')
    showPiles([7, 5, 3])
    addOutput('YOU GO FIRST. WHICH PILE? (1, 2, or 3)')
    setGameState('player')
  }, [])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const showPiles = (currentPiles: number[]) => {
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput(`PILE 1: ${'█'.repeat(currentPiles[0])} (${currentPiles[0]})`)
    addOutput(`PILE 2: ${'█'.repeat(currentPiles[1])} (${currentPiles[1]})`)
    addOutput(`PILE 3: ${'█'.repeat(currentPiles[2])} (${currentPiles[2]})`)
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('')
  }

  const calculateNimSum = (p: number[]) => {
    return p[0] ^ p[1] ^ p[2]
  }

  const computerMove = (currentPiles: number[]) => {
    const nimSum = calculateNimSum(currentPiles)

    // If nimSum is 0, make a random move (losing position)
    if (nimSum === 0) {
      const nonEmptyPiles = currentPiles.map((v, i) => ({ v, i })).filter(p => p.v > 0)
      if (nonEmptyPiles.length === 0) return

      const randomPile = nonEmptyPiles[Math.floor(Math.random() * nonEmptyPiles.length)]
      const remove = Math.min(randomPile.v, Math.floor(Math.random() * 3) + 1)

      addOutput(`Computer takes ${remove} from pile ${randomPile.i + 1}`)
      const newPiles = [...currentPiles]
      newPiles[randomPile.i] -= remove
      setPiles(newPiles)
      addOutput('')
      showPiles(newPiles)

      checkGameOver(newPiles, 'computer')
      return
    }

    // Find optimal move (XOR strategy)
    for (let pile = 0; pile < 3; pile++) {
      if (currentPiles[pile] === 0) continue

      const targetValue = currentPiles[pile] ^ nimSum
      if (targetValue < currentPiles[pile]) {
        const remove = currentPiles[pile] - targetValue
        addOutput(`Computer takes ${remove} from pile ${pile + 1}`)
        const newPiles = [...currentPiles]
        newPiles[pile] -= remove
        setPiles(newPiles)
        addOutput('')
        showPiles(newPiles)

        checkGameOver(newPiles, 'computer')
        return
      }
    }
  }

  const checkGameOver = (currentPiles: number[], lastPlayer: 'player' | 'computer') => {
    const totalLeft = currentPiles.reduce((a, b) => a + b, 0)

    if (totalLeft === 0) {
      setGameState('ended')
      addOutput('')
      addOutput('━━━━━━━━━━━━━━━━━━━━━━━━')
      if (lastPlayer === 'player') {
        addOutput('  💀 YOU TOOK THE LAST OBJECT!')
        addOutput('  YOU LOSE!')
        setComputerWins(computerWins + 1)
      } else {
        addOutput('  🎉 COMPUTER TOOK THE LAST!')
        addOutput('  YOU WIN!')
        setPlayerWins(playerWins + 1)
      }
      addOutput('━━━━━━━━━━━━━━━━━━━━━━━━')
      addOutput('')
      addOutput(`SCORE: You ${playerWins} - ${computerWins} Computer`)
      addOutput('')
      addOutput('PLAY AGAIN? (YES/NO)')
    } else {
      if (lastPlayer === 'player') {
        addOutput('Computer is thinking...')
        setTimeout(() => computerMove(currentPiles), 1000)
      } else {
        addOutput('YOUR TURN. WHICH PILE? (1, 2, or 3)')
        setGameState('player')
        setSelectedPile(null)
      }
    }
  }

  const handleInput = (value: string) => {
    addOutput(`> ${value}`)

    if (gameState === 'ended') {
      const answer = value.trim().toUpperCase()
      if (answer === 'YES' || answer === 'Y') {
        const newPiles = [7, 5, 3]
        setPiles(newPiles)
        setSelectedPile(null)
        addOutput('')
        addOutput('NEW GAME!')
        addOutput('')
        showPiles(newPiles)
        addOutput('YOU GO FIRST. WHICH PILE? (1, 2, or 3)')
        setGameState('player')
      } else {
        addOutput('')
        addOutput('THANKS FOR PLAYING NIM!')
        addOutput(`FINAL SCORE: You ${playerWins} - ${computerWins} Computer`)
        addOutput('')
        addOutput('Press ESC to exit.')
      }
      return
    }

    if (selectedPile === null) {
      const pile = parseInt(value.trim())
      if (isNaN(pile) || pile < 1 || pile > 3) {
        addOutput('INVALID PILE. Enter 1, 2, or 3.')
        return
      }

      if (piles[pile - 1] === 0) {
        addOutput('THAT PILE IS EMPTY!')
        return
      }

      setSelectedPile(pile - 1)
      addOutput(`HOW MANY TO REMOVE FROM PILE ${pile}?`)
    } else {
      const amount = parseInt(value.trim())
      if (isNaN(amount) || amount < 1) {
        addOutput('INVALID AMOUNT. Must be at least 1.')
        setSelectedPile(null)
        addOutput('WHICH PILE? (1, 2, or 3)')
        return
      }

      if (amount > piles[selectedPile]) {
        addOutput(`PILE ${selectedPile + 1} only has ${piles[selectedPile]} objects!`)
        setSelectedPile(null)
        addOutput('WHICH PILE? (1, 2, or 3)')
        return
      }

      const newPiles = [...piles]
      newPiles[selectedPile] -= amount
      setPiles(newPiles)

      addOutput('')
      showPiles(newPiles)
      checkGameOver(newPiles, 'player')
      setSelectedPile(null)
    }
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
        <h2 className="text-green-400 font-mono text-xl">NIM - Game Theory</h2>
        <p className="text-green-600 text-sm">Original BASIC Program #62 (1970) - Teaches Optimal Strategy</p>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm text-green-500 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-black"
      >
        {output.map((line, i) => (
          <div key={i} className={
            line.startsWith('>') ? 'text-green-300' :
            line.includes('YOU WIN') ? 'text-cyan-400 font-bold' :
            line.includes('YOU LOSE') ? 'text-red-400 font-bold' :
            line.includes('Computer') ? 'text-yellow-400' :
            'text-green-500'
          }>
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
          placeholder={selectedPile !== null ? "How many?" : "Which pile?"}
          autoFocus
        />
      </div>

      <div className="mt-2 text-xs text-green-700 text-center">
        Score: You {playerWins} - {computerWins} Computer | ESC to exit
      </div>
    </div>
  )
}
