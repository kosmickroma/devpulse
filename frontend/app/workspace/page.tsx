'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import WorkspaceGrid from '@/components/WorkspaceGrid'
import InteractiveTerminal from '@/components/InteractiveTerminal'
import Sidebar from '@/components/Sidebar'
import { WidgetConfig } from '@/lib/widget-types'

export default function WorkspacePage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [showWidgetMenu, setShowWidgetMenu] = useState(false)
  const [showFullTerminal, setShowFullTerminal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('devpulse-workspace-layout')
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout))
      } catch (e) {
        console.error('Failed to load saved layout:', e)
        loadDefaultLayout()
      }
    } else {
      loadDefaultLayout()
    }
  }, [])

  // Keyboard shortcut: Ctrl+~ to toggle full terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+` (backtick/tilde key)
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        setShowFullTerminal(prev => !prev)
      }
      // Also support Escape to close
      if (e.key === 'Escape' && showFullTerminal) {
        e.preventDefault()
        setShowFullTerminal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFullTerminal])

  const loadDefaultLayout = () => {
    // Default workspace: Compact Command widget + Trends
    const defaultWidgets: WidgetConfig[] = [
      {
        id: 'command-1',
        type: 'command',
        settings: {},
        layout: { x: 0, y: 0, w: 4, h: 6 }
      },
      {
        id: 'trends-1',
        type: 'trends',
        settings: {},
        layout: { x: 4, y: 0, w: 8, h: 8 }
      }
    ]
    setWidgets(defaultWidgets)
  }

  const handleLayoutChange = (updatedWidgets: WidgetConfig[]) => {
    setWidgets(updatedWidgets)
    // Save to localStorage
    localStorage.setItem('devpulse-workspace-layout', JSON.stringify(updatedWidgets))
  }

  const handleAddWidget = (type: string) => {
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      settings: {},
      layout: { x: 0, y: 0, w: 4, h: 6 }
    }
    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    localStorage.setItem('devpulse-workspace-layout', JSON.stringify(updatedWidgets))
    setShowWidgetMenu(false)
  }

  const handleRemoveWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id)
    setWidgets(updatedWidgets)
    localStorage.setItem('devpulse-workspace-layout', JSON.stringify(updatedWidgets))
  }

  const availableWidgets = [
    { type: 'command', name: '⚡ Command', description: 'Quick commands + SYNTH' },
    { type: 'terminal', name: '📟 Terminal', description: 'Full terminal experience' },
    { type: 'trends', name: '🔥 Trends', description: 'Trending repos & articles' },
    { type: 'stock-ticker', name: '📈 Stocks', description: 'Track stock prices' },
    { type: 'crypto-ticker', name: '₿ Crypto', description: 'Track cryptocurrency' },
  ]

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onResetLayout={loadDefaultLayout}
        availableWidgets={availableWidgets}
      />

      {/* Workspace Container */}
      <div className="relative h-[calc(100vh-80px)] overflow-auto">
        <WorkspaceGrid
          widgets={widgets}
          onLayoutChange={handleLayoutChange}
          onRemoveWidget={handleRemoveWidget}
        />

        {/* Full Terminal Overlay */}
        {showFullTerminal && (
          <div className="fixed inset-0 z-[100] bg-dark-bg/95 backdrop-blur-sm">
            <div className="h-full w-full flex flex-col">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-neon-cyan/30 bg-dark-card/80">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📟</div>
                  <div>
                    <h2 className="text-neon-cyan font-mono text-lg font-bold uppercase tracking-wider">
                      Full Terminal
                    </h2>
                    <p className="text-xs text-gray-400 font-mono">
                      Press Ctrl+~ or Esc to close
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullTerminal(false)}
                  className="text-gray-400 hover:text-neon-magenta transition-colors text-2xl px-3"
                >
                  ✕
                </button>
              </div>

              {/* Terminal Content */}
              <div className="flex-1 overflow-hidden p-4">
                <div className="h-full bg-dark-card border-2 border-neon-cyan/30 rounded-lg overflow-hidden">
                  <InteractiveTerminal
                    onDataReceived={() => {}}
                    selectedSources={[]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
