'use client'

import { useEffect, useState } from 'react'
import TrendCard from '@/components/TrendCard'
import Hero from '@/components/Hero'
import FilterBar from '@/components/FilterBar'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TrendingItem } from '@/lib/types'
import { mockTrends } from '@/lib/mockData'

export default function Home() {
  const [trends, setTrends] = useState<TrendingItem[]>([])
  const [filteredTrends, setFilteredTrends] = useState<TrendingItem[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTrends(mockTrends)
      setFilteredTrends(mockTrends)
      setIsLoading(false)
    }, 1000)
  }, [])

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
      <Hero />

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
