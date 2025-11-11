'use client'

import { useState, useEffect, useRef } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WidgetConfig } from '@/lib/widget-types'
import CommandWidget from '@/components/widgets/CommandWidget'
import TerminalWidget from '@/components/widgets/TerminalWidget'
import TrendsWidget from '@/components/widgets/TrendsWidget'
import StockTickerWidget from '@/components/widgets/StockTickerWidget'
import CryptoTickerWidget from '@/components/widgets/CryptoTickerWidget'

interface WorkspaceGridProps {
  widgets: WidgetConfig[]
  onLayoutChange: (widgets: WidgetConfig[]) => void
  onRemoveWidget: (id: string) => void
}

export default function WorkspaceGrid({
  widgets,
  onLayoutChange,
  onRemoveWidget
}: WorkspaceGridProps) {
  const [containerWidth, setContainerWidth] = useState(1200)
  const audioContext = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
  }, [])

  // Play chunky mechanical snap sound - like a real physical snap/click
  const playSnapSound = () => {
    if (!audioContext.current) return

    try {
      const ctx = audioContext.current
      const now = ctx.currentTime

      // Create buffer for white noise (for the "click" part)
      const bufferSize = ctx.sampleRate * 0.05  // 50ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      // White noise source (for mechanical click)
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = buffer
      const noiseGain = ctx.createGain()
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(3000, now)

      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      // Very short, sharp click envelope
      noiseGain.gain.setValueAtTime(0.4, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02)

      // Low frequency thump (for chunky feel)
      const thump = ctx.createOscillator()
      const thumpGain = ctx.createGain()

      thump.connect(thumpGain)
      thumpGain.connect(ctx.destination)

      thump.frequency.setValueAtTime(80, now)
      thump.frequency.exponentialRampToValueAtTime(40, now + 0.03)
      thump.type = 'sine'

      // Punchy envelope for the thump
      thumpGain.gain.setValueAtTime(0.5, now)
      thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04)

      // Play both layers
      noiseSource.start(now)
      thump.start(now)

      noiseSource.stop(now + 0.05)
      thump.stop(now + 0.05)

    } catch (err) {
      console.error('[WorkspaceGrid] Audio error:', err)
    }
  }

  // Lighter sound for undocking (start drag)
  const playUndockSound = () => {
    if (!audioContext.current) return

    try {
      const ctx = audioContext.current
      const now = ctx.currentTime

      // Softer, higher pitch for undocking
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.setValueAtTime(200, now)
      osc.type = 'sine'

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03)

      osc.start(now)
      osc.stop(now + 0.03)
    } catch (err) {
      console.error('[WorkspaceGrid] Audio error:', err)
    }
  }

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.workspace-grid-container')
      if (container) {
        setContainerWidth(container.clientWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleLayoutChange = (newLayout: Layout[]) => {
    // Update widgets with new layout positions
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(l => l.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          layout: layoutItem
        }
      }
      return widget
    })
    onLayoutChange(updatedWidgets)
  }

  const handleDragStart = () => {
    // Removed for now - testing snap sound only
  }

  const handleDragStop = () => {
    playSnapSound()
  }

  const handleResizeStart = () => {
    // Removed for now - testing snap sound only
  }

  const handleResizeStop = () => {
    playSnapSound()
  }

  const renderWidget = (widget: WidgetConfig) => {
    const commonProps = {
      id: widget.id,
      onRemove: () => onRemoveWidget(widget.id)
    }

    switch (widget.type) {
      case 'command':
        return <CommandWidget {...commonProps} settings={widget.settings} />

      case 'terminal':
        return <TerminalWidget {...commonProps} settings={widget.settings} />

      case 'trends':
        return <TrendsWidget {...commonProps} settings={widget.settings} />

      case 'stock-ticker':
      case 'stock_ticker':
        return <StockTickerWidget {...commonProps} settings={widget.settings} />

      case 'crypto-ticker':
      case 'crypto_ticker':
        return <CryptoTickerWidget {...commonProps} settings={widget.settings} />

      default:
        return (
          <div className="h-full flex items-center justify-center bg-dark-card border-2 border-gray-700 rounded-lg">
            <p className="text-gray-400 font-mono text-sm">
              Unknown widget type: {widget.type}
            </p>
          </div>
        )
    }
  }

  const layout: Layout[] = widgets.map(w => ({
    i: w.id,
    x: w.layout.x,
    y: w.layout.y,
    w: w.layout.w,
    h: w.layout.h,
    minW: 3,
    minH: 3
  }))

  return (
    <div className="workspace-grid-container w-full h-full">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[8, 8]}
        containerPadding={[8, 8]}
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        isDraggable={true}
        isResizable={true}
      >
        {widgets.map(widget => (
          <div key={widget.id}>
            {renderWidget(widget)}
          </div>
        ))}
      </GridLayout>
    </div>
  )
}
