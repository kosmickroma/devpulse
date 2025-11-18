'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

type GameState = 'intro' | 'betting' | 'dealing' | 'playerTurn' | 'dealerTurn' | 'results' | 'broke' | 'won'

interface Card {
  rank: string
  suit: string
  value: number
}

export default function Blackjack() {
  const [gameState, setGameState] = useState<GameState>('intro')
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  // Game state
  const [bankroll, setBankroll] = useState(500)
  const [currentBet, setCurrentBet] = useState(0)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [deck, setDeck] = useState<Card[]>([])
  const [handsPlayed, setHandsPlayed] = useState(0)
  const [handsWon, setHandsWon] = useState(0)
  const [maxBankroll, setMaxBankroll] = useState(500)

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  // Initialize game
  useEffect(() => {
    addOutput('BLACKJACK')
    addOutput('CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('')
    addOutput('BLACKJACK IS PLAYED WITH ONE DECK CONSISTING OF 52 CARDS.')
    addOutput('THE OBJECT OF THE GAME IS TO OBTAIN A HIGHER COUNT THAN')
    addOutput('THE DEALER WITHOUT EXCEEDING 21.')
    addOutput('')
    addOutput('CARD VALUES:')
    addOutput('  ACES COUNT 1 OR 11 (WHICHEVER YOU PREFER)')
    addOutput('  KINGS, QUEENS, JACKS COUNT 10')
    addOutput('  OTHER CARDS COUNT THEIR FACE VALUE')
    addOutput('')
    addOutput('YOU START WITH $500')
    addOutput('MINIMUM BET IS $1')
    addOutput('')
    addOutput('')

    const newDeck = createDeck()
    setDeck(shuffleDeck(newDeck))
    setGameState('betting')
    startNewHand()
  }, [])

  // Submit score when broke or won
  useEffect(() => {
    if (gameState === 'broke' || gameState === 'won') {
      submitScore({
        gameId: 'blackjack',
        score: maxBankroll,
        metadata: {
          handsPlayed,
          handsWon,
          winRate: handsPlayed > 0 ? ((handsWon / handsPlayed) * 100).toFixed(1) : '0',
          finalBankroll: bankroll
        }
      }).catch(err => console.error('Failed to submit score:', err))
    }
  }, [gameState])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const createDeck = (): Card[] => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck: Card[] = []

    for (const suit of suits) {
      for (const rank of ranks) {
        let value = 0
        if (rank === 'A') value = 11
        else if (['J', 'Q', 'K'].includes(rank)) value = 10
        else value = parseInt(rank)

        deck.push({ rank, suit, value })
      }
    }

    return deck
  }

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const drawCard = (): Card | null => {
    if (deck.length < 10) {
      // Reshuffle when deck is low
      addOutput('[SHUFFLING NEW DECK...]')
      const newDeck = createDeck()
      setDeck(shuffleDeck(newDeck))
      return newDeck[0]
    }

    const card = deck[0]
    setDeck(prev => prev.slice(1))
    return card
  }

  const calculateHandValue = (hand: Card[]): number => {
    let total = 0
    let aces = 0

    for (const card of hand) {
      total += card.value
      if (card.rank === 'A') aces++
    }

    // Adjust aces from 11 to 1 if needed
    while (total > 21 && aces > 0) {
      total -= 10
      aces--
    }

    return total
  }

  const formatHand = (hand: Card[], hideFirst: boolean = false): string => {
    if (hideFirst && hand.length > 0) {
      return `[HIDDEN] ${hand.slice(1).map(c => `${c.rank}${c.suit}`).join(' ')}`
    }
    return hand.map(c => `${c.rank}${c.suit}`).join(' ')
  }

  const startNewHand = () => {
    if (bankroll <= 0) {
      addOutput('')
      addOutput('YOU\'RE BROKE! BETTER LUCK NEXT TIME.')
      addOutput('YOU PLAYED ' + handsPlayed + ' HANDS AND WON ' + handsWon)
      addOutput('')
      addOutput('PRESS ESC TO EXIT')
      setGameState('broke')
      return
    }

    addOutput(`YOUR BANKROLL: $${bankroll}`)
    addOutput('HOW MUCH DO YOU WANT TO BET?')
  }

  const dealInitialCards = () => {
    const card1 = drawCard()
    const card2 = drawCard()
    const card3 = drawCard()
    const card4 = drawCard()

    if (!card1 || !card2 || !card3 || !card4) return

    const newPlayerHand = [card1, card3]
    const newDealerHand = [card2, card4]

    setPlayerHand(newPlayerHand)
    setDealerHand(newDealerHand)

    addOutput('')
    addOutput(`DEALER SHOWS: ${formatHand(newDealerHand, true)}`)
    addOutput(`YOUR HAND: ${formatHand(newPlayerHand)} = ${calculateHandValue(newPlayerHand)}`)

    const playerValue = calculateHandValue(newPlayerHand)
    const dealerValue = calculateHandValue(newDealerHand)

    // Check for blackjacks
    if (playerValue === 21 && newPlayerHand.length === 2) {
      if (dealerValue === 21 && newDealerHand.length === 2) {
        addOutput('BOTH BLACKJACK! PUSH.')
        setBankroll(prev => prev + currentBet)
        finishHand(false)
      } else {
        addOutput('BLACKJACK! YOU WIN 1.5X YOUR BET!')
        setBankroll(prev => prev + currentBet + Math.floor(currentBet * 1.5))
        setHandsWon(prev => prev + 1)
        finishHand(true)
      }
    } else if (dealerValue === 21 && newDealerHand.length === 2) {
      addOutput(`DEALER HAS BLACKJACK: ${formatHand(newDealerHand)}`)
      addOutput('DEALER WINS.')
      finishHand(false)
    } else {
      // Normal play
      setGameState('playerTurn')
      addOutput('')
      addOutput('HIT OR STAND? (H/S)')
    }
  }

  const playerHit = () => {
    const card = drawCard()
    if (!card) return

    const newHand = [...playerHand, card]
    setPlayerHand(newHand)

    const value = calculateHandValue(newHand)

    addOutput(`YOU DREW: ${card.rank}${card.suit}`)
    addOutput(`YOUR HAND: ${formatHand(newHand)} = ${value}`)

    if (value > 21) {
      addOutput('BUST! YOU LOSE.')
      finishHand(false)
    } else if (value === 21) {
      addOutput('21! DEALER\'S TURN.')
      playDealer()
    } else {
      addOutput('')
      addOutput('HIT OR STAND? (H/S)')
    }
  }

  const playerStand = () => {
    addOutput('YOU STAND.')
    playDealer()
  }

  const playDealer = () => {
    setGameState('dealerTurn')
    addOutput('')
    addOutput(`DEALER'S HAND: ${formatHand(dealerHand)} = ${calculateHandValue(dealerHand)}`)

    let currentHand = [...dealerHand]
    let dealerValue = calculateHandValue(currentHand)

    // Dealer must hit on 16, stand on 17+
    while (dealerValue < 17) {
      const card = drawCard()
      if (!card) break

      currentHand = [...currentHand, card]
      setDealerHand(currentHand)
      dealerValue = calculateHandValue(currentHand)

      addOutput(`DEALER DRAWS: ${card.rank}${card.suit}`)
      addOutput(`DEALER'S HAND: ${formatHand(currentHand)} = ${dealerValue}`)
    }

    if (dealerValue > 21) {
      addOutput('DEALER BUSTS! YOU WIN!')
      setBankroll(prev => prev + currentBet * 2)
      setHandsWon(prev => prev + 1)
      finishHand(true)
    } else {
      const playerValue = calculateHandValue(playerHand)
      addOutput('')

      if (playerValue > dealerValue) {
        addOutput(`YOU WIN! ${playerValue} vs ${dealerValue}`)
        setBankroll(prev => prev + currentBet * 2)
        setHandsWon(prev => prev + 1)
        finishHand(true)
      } else if (playerValue < dealerValue) {
        addOutput(`DEALER WINS. ${dealerValue} vs ${playerValue}`)
        finishHand(false)
      } else {
        addOutput(`PUSH! BOTH ${playerValue}`)
        setBankroll(prev => prev + currentBet)
        finishHand(false)
      }
    }
  }

  const finishHand = (won: boolean) => {
    setHandsPlayed(prev => prev + 1)
    addOutput('')
    addOutput('PLAY AGAIN? (Y/N)')
    setGameState('results')

    // Track max bankroll
    if (bankroll > maxBankroll) {
      setMaxBankroll(bankroll)
    }
  }

  const handleInput = (value: string) => {
    const input = value.trim().toUpperCase()

    addOutput(`> ${input}`)

    if (gameState === 'betting') {
      const bet = parseInt(input)

      if (isNaN(bet) || bet < 1) {
        addOutput('MINIMUM BET IS $1')
        addOutput('')
        addOutput('HOW MUCH DO YOU WANT TO BET?')
        return
      }

      if (bet > bankroll) {
        addOutput('YOU ONLY HAVE $' + bankroll)
        addOutput('')
        addOutput('HOW MUCH DO YOU WANT TO BET?')
        return
      }

      setCurrentBet(bet)
      setBankroll(prev => prev - bet)
      setGameState('dealing')
      dealInitialCards()

    } else if (gameState === 'playerTurn') {
      if (input === 'H' || input === 'HIT') {
        playerHit()
      } else if (input === 'S' || input === 'STAND') {
        playerStand()
      } else {
        addOutput('PLEASE ENTER H FOR HIT OR S FOR STAND')
        addOutput('')
      }

    } else if (gameState === 'results') {
      if (input === 'Y' || input === 'YES') {
        // Reset for new hand
        setPlayerHand([])
        setDealerHand([])
        setCurrentBet(0)
        setGameState('betting')
        addOutput('')
        startNewHand()
      } else if (input === 'N' || input === 'NO') {
        addOutput('')
        addOutput(`FINAL BANKROLL: $${bankroll}`)
        addOutput(`HANDS PLAYED: ${handsPlayed}`)
        addOutput(`HANDS WON: ${handsWon}`)
        if (handsPlayed > 0) {
          addOutput(`WIN RATE: ${((handsWon / handsPlayed) * 100).toFixed(1)}%`)
        }
        addOutput('')
        addOutput('THANKS FOR PLAYING!')
        addOutput('PRESS ESC TO EXIT')
        setGameState('won')
      } else {
        addOutput('PLEASE ENTER Y FOR YES OR N FOR NO')
        addOutput('')
      }
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
        <h2 className="text-green-400 font-mono text-xl">BLACKJACK</h2>
        <p className="text-green-600 text-sm font-mono">Original BASIC Program #18 (1970)</p>
        <p className="text-green-700 text-xs font-mono mt-1">
          Classic casino card game - get as close to 21 as you can
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
      {(gameState === 'betting' || gameState === 'playerTurn' || gameState === 'results') && (
        <div className="flex items-center gap-2 border-t border-green-700 pt-2">
          <span className="text-yellow-500 font-mono">&gt;</span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent text-green-400 font-mono outline-none caret-green-400"
            placeholder={
              gameState === 'betting' ? 'ENTER BET AMOUNT' :
              gameState === 'playerTurn' ? 'H = HIT, S = STAND' :
              'Y = YES, N = NO'
            }
            autoFocus
          />
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-2 text-xs text-green-700 text-center font-mono">
        {gameState !== 'intro' && `BANKROLL: $${bankroll} | HANDS: ${handsPlayed} | WON: ${handsWon}`}
        {gameState === 'broke' && ' | GAME OVER ✗'}
        {gameState === 'won' && ' | CASHED OUT ✓'}
        {' | ESC to exit'}
      </div>
    </div>
  )
}

/*
ORIGINAL BASIC CODE (BLACKJACK.BAS - 1970):

(Simplified version)

Modernized changes:
- React state management for game flow
- Proper card deck shuffling algorithm
- Automatic Ace handling (soft/hard 17)
- Unicode card suits (♠♥♦♣)
- Dealer AI with standard casino rules (hit 16, stand 17)
- Bankroll tracking with win/loss statistics
*/
