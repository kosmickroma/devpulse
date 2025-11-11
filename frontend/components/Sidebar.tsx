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
}

export default function Sidebar({
  isOpen,
  onClose,
  widgets,
  onAddWidget,
  onRemoveWidget,
  onResetLayout,
  availableWidgets = []
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isWorkspace = pathname === '/workspace'

  const navigationLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/workspace', label: 'Command Center', icon: '⚡' },
    { path: '/arcade', label: 'Arcade', icon: '🎮' },
    { path: '/jobs', label: 'Jobs', icon: '💼' },
  ]

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
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Navigation */}
            <div>
              <h3 className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-3">
                Navigation
              </h3>
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
                        ? 'bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan'
                        : 'bg-dark-bg/50 text-gray-300 border-2 border-gray-700 hover:border-neon-cyan hover:text-neon-cyan'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Widget Management (only on workspace) */}
            {isWorkspace && onAddWidget && (
              <div>
                <h3 className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-3">
                  Manage Widgets
                </h3>

                {/* Current Widgets */}
                {widgets && widgets.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-mono">
                      Active: {widgets.length}
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {widgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between px-3 py-2 bg-dark-bg/50 border border-neon-cyan/30 rounded text-xs font-mono"
                        >
                          <span className="text-neon-cyan truncate">
                            {widget.type.toUpperCase()}
                          </span>
                          <button
                            onClick={() => onRemoveWidget && onRemoveWidget(widget.id)}
                            className="text-red-500 hover:text-red-400 ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Widgets */}
                <div className="space-y-2">
                  {availableWidgets.map((widget) => (
                    <button
                      key={widget.type}
                      onClick={() => onAddWidget(widget.type)}
                      className="w-full text-left px-3 py-2 bg-dark-bg/50 border border-neon-cyan/30 rounded hover:border-neon-cyan hover:bg-neon-cyan/10 transition-all"
                    >
                      <div className="font-mono text-xs text-neon-cyan">
                        {widget.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {widget.description}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Reset Layout */}
                {onResetLayout && (
                  <button
                    onClick={onResetLayout}
                    className="w-full mt-4 px-3 py-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded text-neon-magenta font-mono text-xs hover:bg-neon-magenta/20 hover:border-neon-magenta transition-all"
                  >
                    Reset Layout
                  </button>
                )}
              </div>
            )}

            {/* Settings */}
            <div>
              <h3 className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-3">
                Settings
              </h3>
              <button
                className="w-full text-left px-4 py-3 rounded font-mono text-sm bg-dark-bg/50 text-gray-300 border-2 border-gray-700 hover:border-neon-cyan hover:text-neon-cyan transition-all"
              >
                <span className="mr-2">⚙️</span>
                Preferences
              </button>
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
