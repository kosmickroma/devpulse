'use client'

import { useState, useEffect } from 'react'
import Widget from '@/components/Widget'
import { CryptoTickerSettings } from '@/lib/widget-types'

interface CryptoData {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
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

  // Format large numbers with K, M, B suffixes
  const formatMarketCap = (num: number): string => {
    if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  // Format price based on value
  const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toFixed(2)}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    return `$${price.toFixed(8)}`
  }

  // Fetch crypto data
  const fetchCoins = async () => {
    if (settings.coins.length === 0 && !settings.showTrending) {
      setCoins([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TODO: Implement actual API call to backend
      // For now, mock data
      const mockCoins: CryptoData[] = settings.coins.map(coin => ({
        symbol: coin.toUpperCase(),
        name: coin.charAt(0).toUpperCase() + coin.slice(1),
        price: Math.random() * 50000 + 100,
        change24h: (Math.random() - 0.5) * 5000,
        changePercent24h: (Math.random() - 0.5) * 20,
        marketCap: Math.random() * 1_000_000_000_000
      }))

      setCoins(mockCoins)
    } catch (err) {
      setError('Failed to fetch crypto data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoins()

    // Auto-refresh based on settings
    const interval = setInterval(fetchCoins, settings.refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [settings.coins, settings.showTrending, settings.refreshInterval])

  const handleAddCoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (coinInput.trim() && !settings.coins.includes(coinInput.toLowerCase())) {
      // TODO: Call onSettings to update coins
      console.log('Add coin:', coinInput.toLowerCase())
      setCoinInput('')
    }
  }

  return (
    <Widget
      id={id}
      title="Crypto Tracker"
      onRemove={onRemove}
      onSettings={onSettings}
      onRefresh={fetchCoins}
      isRefreshing={loading}
    >
      <div className="space-y-4">
        {/* Add Coin Input */}
        <form onSubmit={handleAddCoin} className="flex gap-2">
          <input
            type="text"
            value={coinInput}
            onChange={(e) => setCoinInput(e.target.value)}
            placeholder="Add coin (e.g., bitcoin)"
            className="flex-1 px-3 py-2 bg-dark-bg border border-neon-magenta/30 rounded text-neon-magenta placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-neon-magenta"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neon-magenta text-black font-bold rounded hover:bg-neon-magenta/80 transition-all text-sm"
          >
            Add
          </button>
        </form>

        {/* Error State */}
        {error && (
          <div className="text-red-500 text-sm font-mono">{error}</div>
        )}

        {/* Empty State */}
        {!loading && coins.length === 0 && (
          <div className="text-center py-8 text-gray-400 font-mono text-sm">
            Add a coin to start tracking crypto
          </div>
        )}

        {/* Crypto List */}
        {coins.length > 0 && (
          <div className="space-y-2">
            {coins.map((coin) => {
              const isPositive = coin.change24h >= 0
              const arrow = isPositive ? '📈' : '📉'
              const colorClass = isPositive ? 'text-neon-green' : 'text-red-500'

              return (
                <div
                  key={coin.symbol}
                  className="border border-neon-magenta/30 rounded-lg p-3 hover:bg-neon-magenta/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-neon-magenta font-bold font-mono mr-2">
                        {coin.symbol}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {coin.name}
                      </span>
                    </div>
                    <span className="text-lg">{arrow}</span>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xl font-bold text-white">
                      {formatPrice(coin.price)}
                    </div>
                    <div className={`text-sm font-mono ${colorClass}`}>
                      {coin.changePercent24h >= 0 ? '+' : ''}{coin.changePercent24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 font-mono">
                    MCap: {formatMarketCap(coin.marketCap)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Loading State */}
        {loading && coins.length === 0 && (
          <div className="text-center py-8 text-neon-magenta font-mono text-sm animate-pulse">
            Loading crypto...
          </div>
        )}
      </div>
    </Widget>
  )
}
