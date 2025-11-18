'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

interface Stock {
  symbol: string
  name: string
  price: number
  owned: number
}

export default function StockGame() {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro')
  const [day, setDay] = useState<number>(1)
  const [cash, setCash] = useState<number>(10000)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<'command' | 'stock' | 'amount'>('command')
  const [selectedStock, setSelectedStock] = useState<string>('')
  const [pendingAction, setPendingAction] = useState<'buy' | 'sell' | null>(null)
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
    addOutput('STOCK - STOCK MARKET SIMULATION')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('YOU HAVE $10,000 TO INVEST IN THE STOCK MARKET.')
    addOutput('TRY TO MAKE AS MUCH MONEY AS POSSIBLE IN 30 DAYS.')
    addOutput('')
    addOutput('Starting portfolio with 5 tech stocks...')
    addOutput('')

    const initialStocks: Stock[] = [
      { symbol: 'AAPL', name: 'Apple Inc', price: 150 + Math.random() * 50, owned: 0 },
      { symbol: 'GOOGL', name: 'Alphabet Inc', price: 100 + Math.random() * 50, owned: 0 },
      { symbol: 'MSFT', name: 'Microsoft', price: 300 + Math.random() * 50, owned: 0 },
      { symbol: 'TSLA', name: 'Tesla', price: 200 + Math.random() * 100, owned: 0 },
      { symbol: 'NVDA', name: 'NVIDIA', price: 400 + Math.random() * 100, owned: 0 }
    ]

    setStocks(initialStocks)
    setGameState('playing')
    showMarketStatus(initialStocks, 1, 10000)
  }, [])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const showMarketStatus = (stockList: Stock[], currentDay: number, currentCash: number) => {
    addOutput(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    addOutput(`DAY ${currentDay}/30 | CASH: $${currentCash.toFixed(2)}`)
    addOutput(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    addOutput('')
    addOutput('SYMBOL  PRICE    OWNED   VALUE')
    addOutput('──────────────────────────────')
    stockList.forEach(stock => {
      const value = stock.owned * stock.price
      addOutput(
        `${stock.symbol.padEnd(6)}  $${stock.price.toFixed(2).padEnd(8)} ${stock.owned.toString().padEnd(6)}  $${value.toFixed(2)}`
      )
    })
    addOutput('')
    const totalValue = currentCash + stockList.reduce((sum, s) => sum + (s.owned * s.price), 0)
    addOutput(`TOTAL PORTFOLIO VALUE: $${totalValue.toFixed(2)}`)
    addOutput('')
    addOutput('Commands: BUY, SELL, NEXT (next day), QUIT')
  }

  const updateStockPrices = (stockList: Stock[]): Stock[] => {
    return stockList.map(stock => ({
      ...stock,
      price: Math.max(10, stock.price * (0.9 + Math.random() * 0.2)) // ±10% change
    }))
  }

  const handleInput = (value: string) => {
    addOutput(`> ${value}`)

    if (inputMode === 'command') {
      const cmd = value.trim().toUpperCase()

      if (cmd === 'BUY') {
        setPendingAction('buy')
        setInputMode('stock')
        addOutput('WHICH STOCK? (Enter symbol)')
      } else if (cmd === 'SELL') {
        setPendingAction('sell')
        setInputMode('stock')
        addOutput('WHICH STOCK? (Enter symbol)')
      } else if (cmd === 'NEXT') {
        if (day >= 30) {
          endGame()
        } else {
          const newDay = day + 1
          const updatedStocks = updateStockPrices(stocks)
          setStocks(updatedStocks)
          setDay(newDay)
          addOutput('')
          addOutput(`━━━━ DAY ${newDay} - MARKET UPDATE ━━━━`)
          addOutput('')
          showMarketStatus(updatedStocks, newDay, cash)
        }
      } else if (cmd === 'QUIT') {
        endGame()
      } else {
        addOutput('INVALID COMMAND. Try: BUY, SELL, NEXT, or QUIT')
      }
    } else if (inputMode === 'stock') {
      const symbol = value.trim().toUpperCase()
      const stock = stocks.find(s => s.symbol === symbol)

      if (!stock) {
        addOutput('STOCK NOT FOUND. Try again.')
        setInputMode('command')
        setPendingAction(null)
        return
      }

      setSelectedStock(symbol)
      setInputMode('amount')

      if (pendingAction === 'buy') {
        const maxShares = Math.floor(cash / stock.price)
        addOutput(`${symbol} @ $${stock.price.toFixed(2)} - You can afford ${maxShares} shares`)
        addOutput('HOW MANY SHARES TO BUY?')
      } else {
        addOutput(`${symbol} @ $${stock.price.toFixed(2)} - You own ${stock.owned} shares`)
        addOutput('HOW MANY SHARES TO SELL?')
      }
    } else if (inputMode === 'amount') {
      const amount = parseInt(value.trim())

      if (isNaN(amount) || amount <= 0) {
        addOutput('INVALID AMOUNT.')
        setInputMode('command')
        setPendingAction(null)
        setSelectedStock('')
        return
      }

      const stock = stocks.find(s => s.symbol === selectedStock)!
      let newCash = cash
      let success = false

      if (pendingAction === 'buy') {
        const cost = amount * stock.price
        if (cost > cash) {
          addOutput('INSUFFICIENT FUNDS!')
        } else {
          newCash = cash - cost
          setCash(newCash)
          setStocks(stocks.map(s =>
            s.symbol === selectedStock ? { ...s, owned: s.owned + amount } : s
          ))
          addOutput(`BOUGHT ${amount} shares of ${selectedStock} for $${cost.toFixed(2)}`)
          success = true
        }
      } else if (pendingAction === 'sell') {
        if (amount > stock.owned) {
          addOutput(`YOU DON'T OWN THAT MANY SHARES!`)
        } else {
          const revenue = amount * stock.price
          newCash = cash + revenue
          setCash(newCash)
          setStocks(stocks.map(s =>
            s.symbol === selectedStock ? { ...s, owned: s.owned - amount } : s
          ))
          addOutput(`SOLD ${amount} shares of ${selectedStock} for $${revenue.toFixed(2)}`)
          success = true
        }
      }

      if (success) {
        addOutput(`NEW CASH BALANCE: $${newCash.toFixed(2)}`)
      }

      addOutput('')
      setInputMode('command')
      setPendingAction(null)
      setSelectedStock('')
    }
  }

  const endGame = () => {
    setGameState('ended')
    const totalValue = cash + stocks.reduce((sum, s) => sum + (s.owned * s.price), 0)
    const profit = totalValue - 10000

    addOutput('')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('        GAME OVER')
    addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addOutput('')
    addOutput(`FINAL DAY: ${day}`)
    addOutput(`CASH: $${cash.toFixed(2)}`)
    addOutput(`PORTFOLIO VALUE: $${(totalValue - cash).toFixed(2)}`)
    addOutput(`TOTAL VALUE: $${totalValue.toFixed(2)}`)
    addOutput('')

    if (profit > 0) {
      addOutput(`PROFIT: $${profit.toFixed(2)} 📈`)
      if (profit > 10000) {
        addOutput('AMAZING! You doubled your money!')
      } else if (profit > 5000) {
        addOutput('EXCELLENT TRADING!')
      } else {
        addOutput('Good job!')
      }
    } else {
      addOutput(`LOSS: $${Math.abs(profit).toFixed(2)} 📉`)
      addOutput('Better luck next time!')
    }
    addOutput('')
    addOutput('Press ESC to exit.')

    // Submit score based on total portfolio value
    const score = Math.round(totalValue)
    submitScore({
      gameId: 'stock',
      score,
      metadata: {
        finalDay: day,
        cash: cash,
        totalValue: totalValue,
        profit: profit
      }
    }).catch(err => console.error('Failed to submit score:', err))
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
        <h2 className="text-green-400 font-mono text-xl">STOCK - Market Simulation</h2>
        <p className="text-green-600 text-sm">Original BASIC Program #83 (1976)</p>
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
          placeholder={
            inputMode === 'command' ? 'Enter command...' :
            inputMode === 'stock' ? 'Enter stock symbol...' :
            'Enter amount...'
          }
          autoFocus
          disabled={gameState === 'ended'}
        />
      </div>

      <div className="mt-2 text-xs text-green-700 text-center">
        Day {day}/30 | Cash: ${cash.toFixed(2)} | ESC to exit
      </div>
    </div>
  )
}
