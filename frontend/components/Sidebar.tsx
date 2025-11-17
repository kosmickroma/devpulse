'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  // Widget management (only on workspace page)
  widgets?: any[]
  onAddWidget?: (type: string) => void
  onRemoveWidget?: (id: string) => void
  onResetLayout?: () => void
  availableWidgets?: Array<{ type: string; name: string; description: string }>
  // Operator Profile callback
  onOpenProfile?: () => void
}

export default function Sidebar({
  isOpen,
  onClose,
  widgets,
  onAddWidget,
  onRemoveWidget,
  onResetLayout,
  availableWidgets = [],
  onOpenProfile
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isWorkspace = pathname === '/workspace'
  const [widgetsExpanded, setWidgetsExpanded] = useState(true)
  const [settingsExpanded, setSettingsExpanded] = useState(true)

  const navigationLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/workspace', label: 'Command Center', icon: '⚡' },
    { path: '/jobs', label: 'Jobs', icon: '💼' },
    { path: '/arcade', label: 'Arcade', icon: '🎮' },
    { path: '#', label: 'API', icon: '🔌' },
  ]

  // Check if a widget type is currently active
  const isWidgetActive = (widgetType: string) => {
    return widgets?.some(w => w.type === widgetType) || false
  }

  // Toggle widget on/off
  const handleWidgetToggle = (widgetType: string) => {
    if (isWidgetActive(widgetType)) {
      // Remove it
      const widgetToRemove = widgets?.find(w => w.type === widgetType)
      if (widgetToRemove && onRemoveWidget) {
        onRemoveWidget(widgetToRemove.id)
      }
    } else {
      // Add it
      if (onAddWidget) {
        onAddWidget(widgetType)
      }
    }
  }

  return (
    <>
      {/* Sidebar Panel */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-dark-card border-r-2 border-neon-cyan shadow-2xl transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b-2 border-neon-cyan/30">
            <h2 className="text-neon-cyan font-mono text-xl font-bold uppercase tracking-wider">
              ⚙️ Menu
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Navigation - Always at top */}
            <div className="space-y-2">
              {navigationLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    router.push(link.path)
                    onClose()
                  }}
                  className={`w-full text-left px-4 py-3 rounded font-mono text-sm transition-all ${
                    pathname === link.path
                      ? 'bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan shadow-neon-cyan'
                      : 'bg-dark-bg/50 text-gray-300 border-2 border-gray-700 hover:border-neon-cyan hover:text-neon-cyan'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>

            {/* Widget Management (expandable, only on workspace) */}
            {isWorkspace && onAddWidget && (
              <div className="border-t-2 border-gray-700 pt-4">
                <button
                  onClick={() => setWidgetsExpanded(!widgetsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-dark-bg/50 border-2 border-gray-700 hover:border-neon-cyan rounded transition-all"
                >
                  <span className="font-mono text-sm text-gray-300">
                    <span className="mr-2">📦</span>
                    Manage Widgets
                  </span>
                  <span className="text-neon-cyan text-xs">
                    {widgetsExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {widgetsExpanded && (
                  <div className="mt-3 space-y-2">
                    {/* All widgets with toggle */}
                    {availableWidgets.map((widget) => {
                      const isActive = isWidgetActive(widget.type)
                      return (
                        <button
                          key={widget.type}
                          onClick={() => handleWidgetToggle(widget.type)}
                          className={`w-full text-left px-3 py-2 rounded border-2 transition-all ${
                            isActive
                              ? 'bg-neon-cyan/10 border-neon-cyan shadow-lg shadow-neon-cyan/50'
                              : 'bg-dark-bg/50 border-gray-700 hover:border-neon-cyan/50'
                          }`}
                        >
                          <div className={`font-mono text-xs font-bold ${
                            isActive ? 'text-neon-cyan' : 'text-gray-300'
                          }`}>
                            {widget.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {widget.description}
                          </div>
                        </button>
                      )
                    })}

                    {/* Reset Layout */}
                    {onResetLayout && (
                      <button
                        onClick={onResetLayout}
                        className="w-full mt-3 px-3 py-2 bg-neon-magenta/10 border-2 border-neon-magenta/30 rounded text-neon-magenta font-mono text-xs hover:bg-neon-magenta/20 hover:border-neon-magenta transition-all"
                      >
                        🔄 Reset Layout
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings (expandable) */}
            <div className="border-t-2 border-gray-700 pt-4">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-dark-bg/50 border-2 border-gray-700 hover:border-neon-cyan rounded transition-all"
              >
                <span className="font-mono text-sm text-gray-300">
                  <span className="mr-2">⚙️</span>
                  Settings
                </span>
                <span className="text-neon-cyan text-xs">
                  {settingsExpanded ? '▼' : '▶'}
                </span>
              </button>

              {settingsExpanded && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => {
                      if (onOpenProfile) {
                        onOpenProfile()
                      }
                      onClose()
                    }}
                    className="w-full text-left px-3 py-2 rounded font-mono text-sm bg-dark-bg/50 text-gray-300 border-2 border-gray-700 hover:border-neon-magenta hover:text-neon-magenta transition-all"
                  >
                    <span className="mr-2">👤</span>
                    Operator Profile
                  </button>
                  <button
                    onClick={() => {
                      router.push('/settings')
                      onClose()
                    }}
                    className="w-full text-left px-3 py-2 rounded font-mono text-sm bg-dark-bg/50 text-gray-300 border-2 border-gray-700 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                  >
                    <span className="mr-2">⚙️</span>
                    Preferences
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-neon-cyan/30">
            <div className="text-xs font-mono text-gray-500 text-center">
              DevPulse v4.0
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
    </>
  )
}
