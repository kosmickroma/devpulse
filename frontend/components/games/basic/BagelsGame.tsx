'use client'

import { useState, useEffect, useRef } from 'react'

export default function BagelsGame() {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'askAgain'>('intro')
  const [secretNumber, setSecretNumber] = useState<string>('')
  const [guessCount, setGuessCount] = useState<number>(0)
  const [maxGuesses, setMaxGuesses] = useState<number>(20)
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    addOutput('BAGELS - NUMBER LOGIC GAME')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('I AM THINKING OF A 3-DIGIT NUMBER.')
    addOutput('TRY TO GUESS IT. HERE ARE THE CLUES:')
    addOutput('')
    addOutput('  PICO   = One digit correct but wrong position')
    addOutput('  FERMI  = One digit correct and right position')
    addOutput('  BAGELS = No digits correct')
    addOutput('')
    addOutput('THE NUMBER HAS NO REPEATED DIGITS.')
    addOutput(`YOU GET ${maxGuesses} GUESSES.`)
    addOutput('')
    startNewGame()
  }, [])

  const startNewGame = () => {
    // Generate 3-digit number with unique digits
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const shuffled = digits.sort(() => Math.random() - 0.5)
    const number = shuffled.slice(0, 3).join('')

    setSecretNumber(number)
    setGuessCount(0)
    setGameState('playing')
    addOutput('OK, I HAVE A NUMBER. START GUESSING!')
  }

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const getClues = (guess: string, secret: string): string => {
    if (guess === secret) return 'YOU WIN!'

    const clues: string[] = []

    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === secret[i]) {
        clues.push('FERMI')
      } else if (secret.includes(guess[i])) {
        clues.push('PICO')
      }
    }

    if (clues.length === 0) return 'BAGELS'

    return clues.sort().join(' ')
  }

  const handleInput = (value: string) => {
    if (gameState === 'intro') return

    if (gameState === 'askAgain') {
      const answer = value.trim().toUpperCase()
      addOutput(`> ${value}`)

      if (answer === 'YES' || answer === 'Y') {
        addOutput('')
        addOutput('GREAT! NEW GAME STARTING...')
        addOutput('')
        startNewGame()
      } else {
        addOutput('')
        addOutput('THANKS FOR PLAYING BAGELS!')
        addOutput(`Total games played. Final stats:`)
        addOutput('')
        addOutput('Press ESC to exit.')
      }
      return
    }

    const guess = value.trim()

    if (!/^\d{3}$/.test(guess)) {
      addOutput(`> ${value}`)
      addOutput('PLEASE ENTER A 3-DIGIT NUMBER.')
      return
    }

    // Check for repeated digits
    if (new Set(guess).size !== 3) {
      addOutput(`> ${value}`)
      addOutput('NO REPEATED DIGITS ALLOWED!')
      return
    }

    addOutput(`> ${guess}`)
    const newCount = guessCount + 1
    setGuessCount(newCount)

    const clue = getClues(guess, secretNumber)
    addOutput(clue)

    if (guess === secretNumber) {
      addOutput('')
      addOutput('*** YOU GOT IT! ***')
      addOutput(`You guessed the number in ${newCount} ${newCount === 1 ? 'try' : 'tries'}.`)
      addOutput(`The number was: ${secretNumber}`)
      addOutput('')

      if (newCount <= 5) {
        addOutput('AMAZING! You\'re a logic master!')
      } else if (newCount <= 10) {
        addOutput('VERY GOOD!')
      } else {
        addOutput('Not bad, but you can do better!')
      }

      addOutput('')
      addOutput('PLAY AGAIN? (YES/NO)')
      setGameState('askAgain')
    } else if (newCount >= maxGuesses) {
      addOutput('')
      addOutput('YOU RAN OUT OF GUESSES!')
      addOutput(`The number was: ${secretNumber}`)
      addOutput('')
      addOutput('PLAY AGAIN? (YES/NO)')
      setGameState('askAgain')
    } else {
      addOutput(`${maxGuesses - newCount} guesses left.`)
      addOutput('')
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
        <h2 className="text-green-400 font-mono text-xl">BAGELS - Number Logic</h2>
        <p className="text-green-600 text-sm">Original BASIC Program #17 (1971) - Teaches Deductive Reasoning</p>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm text-green-500 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-black"
      >
        {output.map((line, i) => (
          <div key={i} className={
            line.startsWith('>') ? 'text-green-300' :
            line.includes('FERMI') || line.includes('PICO') ? 'text-yellow-400' :
            line.includes('BAGELS') ? 'text-red-400' :
            line.includes('WIN') ? 'text-cyan-400 font-bold' :
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
          placeholder="Enter 3-digit number..."
          autoFocus
          maxLength={3}
          disabled={gameState === 'intro'}
        />
      </div>

      <div className="mt-2 text-xs text-green-700 text-center">
        Guesses: {guessCount}/{maxGuesses} | ESC to exit
      </div>
    </div>
  )
}

// Original BASIC code:
/*
10 PRINT "BAGELS"
20 PRINT "CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY"
30 DIM A(3),B(3)
40 PRINT "I AM THINKING OF A 3-DIGIT NUMBER."
50 PRINT "TRY TO GUESS MY NUMBER AND I WILL GIVE YOU CLUES."
60 PRINT "PICO = ONE DIGIT CORRECT BUT WRONG POSITION"
70 PRINT "FERMI = ONE DIGIT CORRECT AND RIGHT POSITION"
80 PRINT "BAGELS = NO DIGITS CORRECT"
90 FOR I=1 TO 3
100 A(I)=INT(10*RND(1))
110 FOR J=1 TO I-1
120 IF A(I)=A(J) THEN 100
130 NEXT J
140 NEXT I
150 FOR I=1 TO 20
160 PRINT "GUESS #";I
170 INPUT B$
180 IF LEN(B$)<>3 THEN 170
190 FOR J=1 TO 3
200 B(J)=VAL(MID$(B$,J,1))
210 NEXT J
220 IF B(1)=A(1) AND B(2)=A(2) AND B(3)=A(3) THEN 280
230 C=0
240 FOR J=1 TO 3
250 IF B(J)=A(J) THEN PRINT "FERMI ";:C=1
260 IF B(J)=A(1) OR B(J)=A(2) OR B(J)=A(3) THEN IF B(J)<>A(J) THEN PRINT "PICO ";:C=1
270 NEXT J
280 IF C=0 THEN PRINT "BAGELS"
290 PRINT
300 NEXT I
310 PRINT "OH WELL. MY NUMBER WAS ";A(1);A(2);A(3)
320 END
*/
