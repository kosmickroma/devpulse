'use client'

import { useState } from 'react'
import { Layout } from 'react-grid-layout'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WidgetDashboard from '@/components/WidgetDashboard'
import StockTickerWidget from '@/components/widgets/StockTickerWidget'
import CryptoTickerWidget from '@/components/widgets/CryptoTickerWidget'
import { WidgetConfig, StockTickerSettings, CryptoTickerSettings } from '@/lib/widget-types'

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    {
      id: 'stock-1',
      type: 'stock_ticker',
      settings: {
        tickers: ['AAPL', 'TSLA', 'NVDA'],
        showTrending: true,
        refreshInterval: 30
      } as StockTickerSettings,
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'crypto-1',
      type: 'crypto_ticker',
      settings: {
        coins: ['bitcoin', 'ethereum', 'solana'],
        showTrending: true,
        refreshInterval: 30
      } as CryptoTickerSettings,
      layout: { x: 6, y: 0, w: 6, h: 4 }
    }
  ])

  const handleLayoutChange = (layout: Layout[]) => {
    console.log('Layout changed:', layout)
    // TODO: Persist layout to Supabase
  }

  const handleWidgetRemove = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId))
  }

  const handleAddWidget = () => {
    // TODO: Open widget catalog modal
    console.log('Add widget clicked')
    alert('Widget catalog coming soon! For now, reload page to reset.')
  }

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'stock_ticker':
        return (
          <StockTickerWidget
            key={widget.id}
            id={widget.id}
            settings={widget.settings as StockTickerSettings}
            onRemove={() => handleWidgetRemove(widget.id)}
            onSettings={() => console.log('Settings for', widget.id)}
          />
        )

      case 'crypto_ticker':
        return (
          <CryptoTickerWidget
            key={widget.id}
            id={widget.id}
            settings={widget.settings as CryptoTickerSettings}
            onRemove={() => handleWidgetRemove(widget.id)}
            onSettings={() => console.log('Settings for', widget.id)}
          />
        )

      default:
        return (
          <div key={widget.id} className="p-4 text-gray-400">
            Unknown widget type: {widget.type}
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-cyan mb-2">
            🚀 Widget Dashboard Demo
          </h1>
          <p className="text-gray-400 font-mono">
            Drag and resize widgets to customize your layout. This is just the beginning!
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 border-2 border-neon-green/30 rounded-lg p-4 bg-neon-green/5">
          <h3 className="text-neon-green font-bold mb-2">🎯 Phase 1: Foundation Complete!</h3>
          <ul className="text-gray-300 text-sm space-y-1 font-mono">
            <li>✅ Drag & drop grid system</li>
            <li>✅ Stock ticker widget (type in tickers)</li>
            <li>✅ Crypto tracker widget</li>
            <li>⏳ Widget catalog (coming next)</li>
            <li>⏳ Layout persistence to database</li>
            <li>⏳ Feed widget, SYNTH widget, News widget</li>
          </ul>
        </div>

        {/* Widget Dashboard */}
        <WidgetDashboard
          widgets={widgets}
          onLayoutChange={handleLayoutChange}
          onWidgetRemove={handleWidgetRemove}
          onAddWidget={handleAddWidget}
          renderWidget={renderWidget}
        />
      </div>

      <Footer />
    </main>
  )
}
