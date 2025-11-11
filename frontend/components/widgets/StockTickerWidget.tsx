'use client'

import { useState, useEffect, useCallback } from 'react'
import Widget from '@/components/Widget'
import { StockTickerSettings } from '@/lib/widget-types'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
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
  const [watchlist, setWatchlist] = useState<string[]>(settings.tickers || [])

  // Fetch stock data from backend
  const fetchStocks = useCallback(async () => {
    if (watchlist.length === 0 && !settings.showTrending) {
      setStocks([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Fetch trending stocks from backend
      const response = await fetch(`${API_URL}/api/scan?sources=yahoo_finance`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch stocks`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const stockResults: StockData[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6))
                if (event.type === 'item' && event.data.source === 'yahoo_finance') {
                  const item = event.data
                  // Parse stock data from spider format
                  const priceMatch = item.description?.match(/\$([0-9,.]+)/)
                  const changeMatch = item.description?.match(/\(([+-][0-9,.]+),\s*([+-][0-9.]+%)\)/)

                  if (priceMatch && changeMatch) {
                    stockResults.push({
                      symbol: item.title?.match(/[📈📉]\s*([A-Z]+)/)?.[1] || 'N/A',
                      name: item.title?.split(' - ')[1] || item.title || 'Unknown',
                      price: parseFloat(priceMatch[1].replace(/,/g, '')),
                      change: parseFloat(changeMatch[1].replace(/,/g, '')),
                      changePercent: parseFloat(changeMatch[2]),
                      volume: item.score || 0,
                      marketCap: item.stars || 0
                    })
                  }
                }
              } catch (e) {
                console.error('Parse error:', e)
              }
            }
          }
        }
      }

      setStocks(stockResults.slice(0, 10))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stock data')
      console.error('[STOCK WIDGET] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [watchlist, settings.showTrending])

  useEffect(() => {
    fetchStocks()
    const interval = setInterval(fetchStocks, settings.refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [fetchStocks, settings.refreshInterval])

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault()
    const ticker = tickerInput.toUpperCase().trim()
    if (ticker && !watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker])
      setTickerInput('')
    }
  }

  const handleRemoveTicker = (ticker: string) => {
    setWatchlist(watchlist.filter(t => t !== ticker))
  }

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(2)}T`
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
    return num.toFixed(0)
  }

  return (
    <Widget
      id={id}
      title="📈 STOCK TRACKER"
      onRemove={onRemove}
      onSettings={onSettings}
      onRefresh={fetchStocks}
      isRefreshing={loading}
    >
      <div className="space-y-4 h-full flex flex-col">
        {/* Add Ticker Input */}
        <form onSubmit={handleAddTicker} className="flex gap-2">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            placeholder="ENTER TICKER (e.g., AAPL)"
            className="flex-1 px-4 py-2 bg-dark-bg/50 border-2 border-neon-cyan/30 rounded text-neon-cyan placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all uppercase"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-green text-black font-bold rounded font-mono hover:shadow-neon-cyan transition-all text-sm uppercase tracking-wider"
          >
            ADD
          </button>
        </form>

        {/* Watchlist Pills */}
        {watchlist.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {watchlist.map(ticker => (
              <button
                key={ticker}
                onClick={() => handleRemoveTicker(ticker)}
                className="px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-neon-cyan text-xs font-mono hover:bg-neon-cyan/20 hover:border-neon-cyan transition-all flex items-center gap-1"
              >
                {ticker} <span className="text-red-500">×</span>
              </button>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-red-500 text-sm font-mono bg-red-500/10 border border-red-500/30 rounded p-3">
            ⚠️ {error}
          </div>
        )}

        {/* Stock List */}
        <div className="flex-1 overflow-auto space-y-3">
          {loading && stocks.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-pulse text-neon-cyan font-mono text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping"></div>
                  SCANNING MARKETS...
                </div>
              </div>
            </div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-mono text-sm">
              <div className="text-4xl mb-4 opacity-20">📊</div>
              {watchlist.length === 0
                ? 'ADD TICKERS TO YOUR WATCHLIST'
                : 'NO DATA AVAILABLE'
              }
            </div>
          ) : (
            stocks.map((stock, index) => {
              const isPositive = stock.change >= 0
              const glowColor = isPositive ? 'neon-green' : 'red-500'
              const borderColor = isPositive ? 'border-neon-green/30' : 'border-red-500/30'
              const bgColor = isPositive ? 'bg-neon-green/5' : 'bg-red-500/5'

              return (
                <div
                  key={stock.symbol + index}
                  className={`group relative border-2 ${borderColor} ${bgColor} rounded-lg p-4 hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden`}
                  style={{
                    animation: `fadeIn 0.3s ease ${index * 0.1}s both`
                  }}
                >
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>

                  <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl ${isPositive ? 'animate-bounce' : ''}`}>
                            {isPositive ? '📈' : '📉'}
                          </span>
                          <h3 className="text-neon-cyan font-bold font-mono text-lg tracking-wider">
                            {stock.symbol}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-xs mt-1 font-mono">
                          {stock.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          ${stock.price.toFixed(2)}
                        </div>
                        <div className={`text-sm font-mono font-bold ${isPositive ? 'text-neon-green' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{stock.change.toFixed(2)}
                          <span className="ml-1">
                            ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    {(stock.volume || stock.marketCap) && (
                      <div className="flex items-center justify-between text-xs font-mono text-gray-500 mt-3 pt-3 border-t border-gray-700/30">
                        {stock.volume && (
                          <div>
                            <span className="text-gray-600">VOL:</span>{' '}
                            <span className="text-neon-cyan">${formatNumber(stock.volume)}</span>
                          </div>
                        )}
                        {stock.marketCap && (
                          <div>
                            <span className="text-gray-600">MCAP:</span>{' '}
                            <span className="text-neon-cyan">${formatNumber(stock.marketCap)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Status Bar */}
        <div className="text-xs font-mono text-gray-500 border-t border-neon-cyan/20 pt-2 flex items-center justify-between">
          <span>TRACKING: {stocks.length} STOCKS</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>
    </Widget>
  )
}
