'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

export default function GuessGame() {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'askAgain'>('intro')
  const [targetNumber, setTargetNumber] = useState<number>(0)
  const [guessCount, setGuessCount] = useState<number>(0)
  const [maxNumber, setMaxNumber] = useState<number>(100)
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
    addOutput('GUESS - NUMBER GUESSING GAME')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('I\'M THINKING OF A NUMBER BETWEEN 1 AND 100.')
    addOutput('TRY TO GUESS IT IN THE FEWEST ATTEMPTS.')
    addOutput('')
    startNewGame()
  }, [])

  // Submit score when game is won
  useEffect(() => {
    if (gameState === 'won' && guessCount > 0) {
      // Score: fewer guesses = higher score (100 - guesses)
      const score = Math.max(0, 100 - guessCount)
      submitScore({
        gameId: 'guess',
        score,
        metadata: { guesses: guessCount }
      }).catch(err => console.error('Failed to submit score:', err))
    }
  }, [gameState, guessCount])

  const startNewGame = () => {
    const num = Math.floor(Math.random() * maxNumber) + 1
    setTargetNumber(num)
    setGuessCount(0)
    setGameState('playing')
    addOutput('I\'M READY. WHAT\'S YOUR GUESS?')
  }

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const handleInput = (value: string) => {
    if (gameState === 'intro') return

    if (gameState === 'askAgain') {
      const answer = value.trim().toUpperCase()
      addOutput(`> ${value}`)

      if (answer === 'YES' || answer === 'Y') {
        addOutput('')
        addOutput('GREAT! LET\'S PLAY AGAIN!')
        addOutput('')
        setOutput(prev => [...prev, ''])
        startNewGame()
      } else {
        addOutput('')
        addOutput('THANKS FOR PLAYING!')
        addOutput(`GAME STATISTICS:`)
        addOutput(`  Total guesses: ${guessCount}`)
        addOutput('')
        addOutput('Press ESC to exit.')
      }
      return
    }

    const guess = parseInt(value.trim())

    if (isNaN(guess)) {
      addOutput(`> ${value}`)
      addOutput('PLEASE ENTER A NUMBER.')
      return
    }

    addOutput(`> ${guess}`)
    const newCount = guessCount + 1
    setGuessCount(newCount)

    if (guess === targetNumber) {
      addOutput('')
      addOutput('*** CONGRATULATIONS! YOU GOT IT! ***')
      addOutput(`You guessed it in ${newCount} ${newCount === 1 ? 'try' : 'tries'}.`)

      // Provide feedback based on performance
      if (newCount <= 3) {
        addOutput('EXCELLENT! You\'re a natural!')
      } else if (newCount <= 5) {
        addOutput('VERY GOOD!')
      } else if (newCount <= 7) {
        addOutput('GOOD JOB!')
      } else {
        addOutput('Not bad, but you can do better!')
      }

      addOutput('')
      addOutput('WOULD YOU LIKE TO PLAY AGAIN? (YES/NO)')
      setGameState('askAgain')
    } else if (guess < targetNumber) {
      addOutput('TOO LOW. TRY AGAIN.')
    } else {
      addOutput('TOO HIGH. TRY AGAIN.')
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
        <h2 className="text-green-400 font-mono text-xl">GUESS - Number Guessing Game</h2>
        <p className="text-green-600 text-sm">Original BASIC Program #35 (1973)</p>
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
          placeholder="Type your answer and press ENTER..."
          autoFocus
          disabled={gameState === 'intro'}
        />
      </div>

      <div className="mt-2 text-xs text-green-700 text-center">
        Guesses: {guessCount} | Range: 1-{maxNumber} | ESC to exit
      </div>
    </div>
  )
}

// Original BASIC code for reference:
/*
10 PRINT "GUESS - NUMBER GUESSING GAME"
20 PRINT "CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY"
30 PRINT
40 PRINT "I'M THINKING OF A NUMBER BETWEEN 1 AND 100."
50 PRINT "TRY TO GUESS IT IN THE FEWEST ATTEMPTS."
60 LET N=INT(RND(1)*100)+1
70 LET C=0
80 PRINT "GUESS";
90 INPUT G
100 LET C=C+1
110 IF G=N THEN 140
120 IF G<N THEN PRINT "TOO LOW": GOTO 80
130 IF G>N THEN PRINT "TOO HIGH": GOTO 80
140 PRINT "CONGRATULATIONS! YOU GOT IT IN";C;"TRIES."
150 PRINT "PLAY AGAIN (YES OR NO)";
160 INPUT A$
170 IF A$="YES" THEN 60
180 END
*/
