'use client'

import { useState, useEffect, useCallback } from 'react'
import Widget from '@/components/Widget'
import { CryptoTickerSettings } from '@/lib/widget-types'

interface CryptoData {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  rank?: number
}

interface CryptoTickerWidgetProps {
  id: string
  settings: CryptoTickerSettings
  onRemove?: () => void
  onSettings?: () => void
}

export default function CryptoTickerWidget({
  id,
  settings,
  onRemove,
  onSettings
}: CryptoTickerWidgetProps) {
  const [coins, setCoins] = useState<CryptoData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coinInput, setCoinInput] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(settings.coins || [])

  const formatMarketCap = (num: number): string => {
    if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    return `$${price.toFixed(8)}`
  }

  // Fetch crypto data from backend
  const fetchCoins = useCallback(async () => {
    if (watchlist.length === 0 && !settings.showTrending) {
      setCoins([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const response = await fetch(`${API_URL}/api/scan?sources=crypto`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch crypto`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const cryptoResults: CryptoData[] = []

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
                if (event.type === 'item' && event.data.source === 'crypto') {
                  const item = event.data
                  // Parse crypto data from spider format
                  const priceMatch = item.description?.match(/\$([0-9,.]+)/)
                  const changeMatch = item.description?.match(/\(([+-][0-9.]+)%/)
                  const rankMatch = item.description?.match(/Rank:\s*#([0-9]+)/)

                  if (priceMatch) {
                    cryptoResults.push({
                      symbol: item.title?.match(/[🔥📈📉]\s*([A-Z]+)/)?.[1] || 'N/A',
                      name: item.title?.split(' - ')[1]?.split(' (')[0] || item.title || 'Unknown',
                      price: parseFloat(priceMatch[1].replace(/,/g, '')),
                      change24h: 0, // Will calculate from percent
                      changePercent24h: changeMatch ? parseFloat(changeMatch[1]) : 0,
                      marketCap: item.stars || 0,
                      rank: rankMatch ? parseInt(rankMatch[1]) : undefined
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

      setCoins(cryptoResults.slice(0, 10))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch crypto data')
      console.error('[CRYPTO WIDGET] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [watchlist, settings.showTrending])

  useEffect(() => {
    fetchCoins()
    const interval = setInterval(fetchCoins, settings.refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [fetchCoins, settings.refreshInterval])

  const handleAddCoin = (e: React.FormEvent) => {
    e.preventDefault()
    const coin = coinInput.toLowerCase().trim()
    if (coin && !watchlist.includes(coin)) {
      setWatchlist([...watchlist, coin])
      setCoinInput('')
    }
  }

  const handleRemoveCoin = (coin: string) => {
    setWatchlist(watchlist.filter(c => c !== coin))
  }

  return (
    <Widget
      id={id}
      title="₿ CRYPTO TRACKER"
      onRemove={onRemove}
      onSettings={onSettings}
      onRefresh={fetchCoins}
      isRefreshing={loading}
    >
      <div className="space-y-4 h-full flex flex-col">
        {/* Add Coin Input */}
        <form onSubmit={handleAddCoin} className="flex gap-2">
          <input
            type="text"
            value={coinInput}
            onChange={(e) => setCoinInput(e.target.value)}
            placeholder="ENTER COIN (e.g., bitcoin)"
            className="flex-1 px-4 py-2 bg-dark-bg/50 border-2 border-neon-magenta/30 rounded text-neon-magenta placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-neon-magenta focus:shadow-neon-magenta transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-neon-magenta to-neon-cyan text-black font-bold rounded font-mono hover:shadow-neon-magenta transition-all text-sm uppercase tracking-wider"
          >
            ADD
          </button>
        </form>

        {/* Watchlist Pills */}
        {watchlist.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {watchlist.map(coin => (
              <button
                key={coin}
                onClick={() => handleRemoveCoin(coin)}
                className="px-3 py-1 bg-neon-magenta/10 border border-neon-magenta/30 rounded-full text-neon-magenta text-xs font-mono hover:bg-neon-magenta/20 hover:border-neon-magenta transition-all flex items-center gap-1 capitalize"
              >
                {coin} <span className="text-red-500">×</span>
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

        {/* Crypto List */}
        <div className="flex-1 overflow-auto space-y-3">
          {loading && coins.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-pulse text-neon-magenta font-mono text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-neon-magenta rounded-full animate-ping"></div>
                  SCANNING BLOCKCHAIN...
                </div>
              </div>
            </div>
          ) : coins.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-mono text-sm">
              <div className="text-4xl mb-4 opacity-20">₿</div>
              {watchlist.length === 0
                ? 'ADD COINS TO YOUR WATCHLIST'
                : 'NO DATA AVAILABLE'
              }
            </div>
          ) : (
            coins.map((coin, index) => {
              const isPositive = coin.changePercent24h >= 0
              const borderColor = isPositive ? 'border-neon-green/30' : 'border-red-500/30'
              const bgColor = isPositive ? 'bg-neon-green/5' : 'bg-red-500/5'

              return (
                <div
                  key={coin.symbol + index}
                  className={`group relative border-2 ${borderColor} ${bgColor} rounded-lg p-4 hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden`}
                  style={{
                    animation: `fadeIn 0.3s ease ${index * 0.1}s both`
                  }}
                >
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-magenta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>

                  <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{isPositive ? '🚀' : '💎'}</span>
                          <h3 className="text-neon-magenta font-bold font-mono text-lg tracking-wider">
                            {coin.symbol}
                          </h3>
                          {coin.rank && (
                            <span className="px-2 py-0.5 bg-neon-cyan/20 border border-neon-cyan/30 rounded text-neon-cyan text-xs font-mono">
                              #{coin.rank}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs font-mono">
                          {coin.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          {formatPrice(coin.price)}
                        </div>
                        <div className={`text-sm font-mono font-bold ${isPositive ? 'text-neon-green' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{coin.changePercent24h.toFixed(2)}%
                          <span className="text-xs text-gray-500 ml-1">24h</span>
                        </div>
                      </div>
                    </div>

                    {/* Market Cap */}
                    {coin.marketCap > 0 && (
                      <div className="flex items-center justify-between text-xs font-mono mt-3 pt-3 border-t border-gray-700/30">
                        <div className="text-gray-600">MARKET CAP</div>
                        <div className="text-neon-magenta font-bold">
                          {formatMarketCap(coin.marketCap)}
                        </div>
                      </div>
                    )}

                    {/* Price Change Bar */}
                    <div className="mt-3">
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            isPositive
                              ? 'bg-gradient-to-r from-neon-green to-neon-cyan'
                              : 'bg-gradient-to-r from-red-500 to-red-700'
                          }`}
                          style={{
                            width: `${Math.min(Math.abs(coin.changePercent24h) * 5, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Status Bar */}
        <div className="text-xs font-mono text-gray-500 border-t border-neon-magenta/20 pt-2 flex items-center justify-between">
          <span>TRACKING: {coins.length} COINS</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-neon-magenta rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>
    </Widget>
  )
}
