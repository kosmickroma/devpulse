'use client'

import { useEffect, useState } from 'react'
import TrendCard from '@/components/TrendCard'
import InteractiveTerminal from '@/components/InteractiveTerminal'
import FilterBar from '@/components/FilterBar'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TrendingItem } from '@/lib/types'

export default function Home() {
  const [trends, setTrends] = useState<TrendingItem[]>([])
  const [filteredTrends, setFilteredTrends] = useState<TrendingItem[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Force page to stay at top on load
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleDataReceived = (items: TrendingItem[]) => {
    setTrends(items)
    setFilteredTrends(items)
  }

  useEffect(() => {
    if (selectedSource === 'all') {
      setFilteredTrends(trends)
    } else {
      setFilteredTrends(trends.filter(trend => trend.source === selectedSource))
    }
  }, [selectedSource, trends])

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section with Logo */}
      <div className="relative overflow-hidden border-b-2 border-neon-cyan/30 py-12">
        <div className="absolute inset-0 perspective-grid opacity-20" style={{ height: '300px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/devpulse_logo.svg"
              alt="DevPulse"
              className="w-full max-w-2xl h-auto"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(255, 0, 255, 0.4)) drop-shadow(0 0 50px rgba(0, 255, 255, 0.3))',
              }}
            />
          </div>
          <p className="text-xl text-neon-green neon-text-green font-mono">
            &gt; TRACK THE PULSE OF DEVELOPER TRENDS
          </p>
        </div>
      </div>

      {/* Interactive Terminal */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <InteractiveTerminal onDataReceived={handleDataReceived} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FilterBar
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-neon-cyan font-mono">LOADING TRENDS...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredTrends.map((trend, index) => (
              <TrendCard key={trend.id} trend={trend} index={index} />
            ))}
          </div>
        )}

        {!isLoading && filteredTrends.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-neon-magenta font-mono">NO TRENDS FOUND</p>
            <p className="text-gray-400 mt-2">Try selecting a different source</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
