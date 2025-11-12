'use client'

import { useState, useEffect } from 'react'
import Widget from '@/components/Widget'
import TrendCard from '@/components/TrendCard'
import SimpleFilterBar from '@/components/SimpleFilterBar'
import { TrendingItem } from '@/lib/types'
import { loadTodaysScanResults } from '@/lib/db'

interface TrendsWidgetProps {
  id: string
  settings: Record<string, any>
  onRemove?: () => void
  onSettings?: () => void
}

export default function TrendsWidget({
  id,
  settings,
  onRemove,
  onSettings
}: TrendsWidgetProps) {
  const [trends, setTrends] = useState<TrendingItem[]>([])
  const [filteredTrends, setFilteredTrends] = useState<TrendingItem[]>([])
  const [prioritySource, setPrioritySource] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load cached results on mount
  useEffect(() => {
    loadTodaysScanResults().then(cachedItems => {
      if (cachedItems.length > 0) {
        setTrends(cachedItems)
        setFilteredTrends(cachedItems)
      }
    })
  }, [])

  // Listen for trends updates from terminal
  useEffect(() => {
    const handleTrendsUpdate = (event: CustomEvent) => {
      const items = event.detail
      setTrends(items)
      setFilteredTrends(items)
    }

    window.addEventListener('trends-updated', handleTrendsUpdate as EventListener)
    return () => {
      window.removeEventListener('trends-updated', handleTrendsUpdate as EventListener)
    }
  }, [])

  // Prioritize trends by source
  useEffect(() => {
    if (!prioritySource) {
      setFilteredTrends(trends)
    } else {
      const priorityItems = trends.filter(trend => trend.source.split('/')[0] === prioritySource)
      const otherItems = trends.filter(trend => trend.source.split('/')[0] !== prioritySource)
      setFilteredTrends([...priorityItems, ...otherItems])
    }
  }, [prioritySource, trends])

  const handleSourceSelect = (source: string | null) => {
    setPrioritySource(source)
  }

  // Get unique sources from trends
  const activeSources = Array.from(new Set(trends.map(t => t.source.split('/')[0])))

  const handleRefresh = () => {
    setIsLoading(true)
    loadTodaysScanResults().then(cachedItems => {
      setTrends(cachedItems)
      setFilteredTrends(cachedItems)
      setIsLoading(false)
    })
  }

  return (
    <Widget
      id={id}
      title="🔥 TRENDS"
      onRemove={onRemove}
      onSettings={onSettings}
      onRefresh={handleRefresh}
      isRefreshing={isLoading}
    >
      <div className="h-full flex flex-col">
        {/* Filter Bar */}
        <div className="mb-4">
          <SimpleFilterBar
            onSourceSelect={handleSourceSelect}
            activeSources={activeSources}
            prioritySource={prioritySource}
          />
        </div>

        {/* Trends Grid - Scrollable */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-neon-cyan font-mono text-sm">LOADING...</p>
              </div>
            </div>
          ) : filteredTrends.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-neon-magenta font-mono text-lg">NO TRENDS FOUND</p>
                <p className="text-gray-400 text-sm mt-2">Try selecting different sources</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrends.map((trend, index) => (
                <TrendCard key={trend.id} trend={trend} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="mt-4 pt-3 border-t border-neon-cyan/20 text-xs font-mono text-gray-500 flex items-center justify-between">
          <span>SHOWING: {filteredTrends.length} / {trends.length} TRENDS</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>
    </Widget>
  )
}
