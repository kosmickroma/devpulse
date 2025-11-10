'use client'

import { useState, useEffect } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WidgetConfig, WidgetType, DEFAULT_WIDGET_LAYOUTS } from '@/lib/widget-types'

interface WidgetDashboardProps {
  widgets: WidgetConfig[]
  onLayoutChange?: (layout: Layout[]) => void
  onWidgetRemove?: (widgetId: string) => void
  onAddWidget?: () => void
  renderWidget: (widget: WidgetConfig) => React.ReactNode
}

export default function WidgetDashboard({
  widgets,
  onLayoutChange,
  onWidgetRemove,
  onAddWidget,
  renderWidget
}: WidgetDashboardProps) {
  const [layout, setLayout] = useState<Layout[]>([])
  const [containerWidth, setContainerWidth] = useState(1200)

  // Initialize layout from widgets
  useEffect(() => {
    const initialLayout: Layout[] = widgets.map((widget, index) => {
      const defaultLayout = DEFAULT_WIDGET_LAYOUTS[widget.type]

      return {
        i: widget.id,
        x: (index * 6) % 12,
        y: Math.floor(index / 2) * 4,
        w: defaultLayout.w || 6,
        h: defaultLayout.h || 4,
        minW: defaultLayout.minW || 3,
        minH: defaultLayout.minH || 3,
      }
    })

    setLayout(initialLayout)
  }, [widgets])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('widget-dashboard-container')
      if (container) {
        setContainerWidth(container.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout)
    if (onLayoutChange) {
      onLayoutChange(newLayout)
    }
  }

  return (
    <div className="w-full">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neon-cyan mb-1">Dashboard</h2>
          <p className="text-gray-400 text-sm font-mono">
            Drag and resize widgets to customize your layout
          </p>
        </div>

        {onAddWidget && (
          <button
            onClick={onAddWidget}
            className="px-4 py-2 bg-neon-cyan text-black font-bold rounded hover:bg-neon-cyan/80 transition-all"
          >
            + Add Widget
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div id="widget-dashboard-container" className="w-full">
        {widgets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neon-cyan/30 rounded-lg">
            <p className="text-gray-400 font-mono mb-4">
              No widgets yet. Add your first widget to get started!
            </p>
            {onAddWidget && (
              <button
                onClick={onAddWidget}
                className="px-6 py-3 bg-neon-cyan text-black font-bold rounded hover:bg-neon-cyan/80 transition-all"
              >
                + Add Widget
              </button>
            )}
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={60}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
            compactType="vertical"
            preventCollision={false}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="widget-grid-item">
                {renderWidget(widget)}
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  )
}
