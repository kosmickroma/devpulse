'use client'

import { useState, useEffect } from 'react'
import Widget from '@/components/Widget'
import { StockTickerSettings } from '@/lib/widget-types'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface StockTickerWidgetProps {
  id: string
  settings: StockTickerSettings
  onRemove?: () => void
  onSettings?: () => void
}

export default function StockTickerWidget({
  id,
  settings,
  onRemove,
  onSettings
}: StockTickerWidgetProps) {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickerInput, setTickerInput] = useState('')

  // Fetch stock data
  const fetchStocks = async () => {
    if (settings.tickers.length === 0 && !settings.showTrending) {
      setStocks([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TODO: Implement actual API call to backend
      // For now, mock data
      const mockStocks: StockData[] = settings.tickers.map(ticker => ({
        symbol: ticker,
        name: `${ticker} Inc.`,
        price: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 10
      }))

      setStocks(mockStocks)
    } catch (err) {
      setError('Failed to fetch stock data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStocks()

    // Auto-refresh based on settings
    const interval = setInterval(fetchStocks, settings.refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [settings.tickers, settings.showTrending, settings.refreshInterval])

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault()
    if (tickerInput.trim() && !settings.tickers.includes(tickerInput.toUpperCase())) {
      // TODO: Call onSettings to update tickers
      console.log('Add ticker:', tickerInput.toUpperCase())
      setTickerInput('')
    }
  }

  return (
    <Widget
      id={id}
      title="Stock Tracker"
      onRemove={onRemove}
      onSettings={onSettings}
      onRefresh={fetchStocks}
      isRefreshing={loading}
    >
      <div className="space-y-4">
        {/* Add Ticker Input */}
        <form onSubmit={handleAddTicker} className="flex gap-2">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            placeholder="Add ticker (e.g., AAPL)"
            className="flex-1 px-3 py-2 bg-dark-bg border border-neon-cyan/30 rounded text-neon-cyan placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-neon-cyan"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neon-cyan text-black font-bold rounded hover:bg-neon-cyan/80 transition-all text-sm"
          >
            Add
          </button>
        </form>

        {/* Error State */}
        {error && (
          <div className="text-red-500 text-sm font-mono">{error}</div>
        )}

        {/* Empty State */}
        {!loading && stocks.length === 0 && (
          <div className="text-center py-8 text-gray-400 font-mono text-sm">
            Add a ticker symbol to start tracking stocks
          </div>
        )}

        {/* Stock List */}
        {stocks.length > 0 && (
          <div className="space-y-2">
            {stocks.map((stock) => {
              const isPositive = stock.change >= 0
              const arrow = isPositive ? '📈' : '📉'
              const colorClass = isPositive ? 'text-neon-green' : 'text-red-500'

              return (
                <div
                  key={stock.symbol}
                  className="border border-neon-cyan/30 rounded-lg p-3 hover:bg-neon-cyan/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-neon-cyan font-bold font-mono mr-2">
                        {stock.symbol}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {stock.name}
                      </span>
                    </div>
                    <span className="text-lg">{arrow}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-white">
                      ${stock.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-mono ${colorClass}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Loading State */}
        {loading && stocks.length === 0 && (
          <div className="text-center py-8 text-neon-cyan font-mono text-sm animate-pulse">
            Loading stocks...
          </div>
        )}
      </div>
    </Widget>
  )
}
