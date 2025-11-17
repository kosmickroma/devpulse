'use client'

import React, { useEffect, useState } from 'react'
import SnakeGame from './games/SnakeGame'
import Minesweeper from './games/Minesweeper'
import SpaceInvaders from './games/SpaceInvaders'
import CodeQuest from './games/CodeQuest'

interface GameOverlayProps {
  game: 'snake' | 'minesweeper' | 'spaceinvaders' | 'codequest' | null
  onClose: () => void
  showNotification?: boolean
  notificationMessage?: string
}

// Create a context to pass notification to child components
export const GameNotificationContext = React.createContext<{
  showNotification: boolean
  notificationMessage: string
}>({
  showNotification: false,
  notificationMessage: ''
})

export default function GameOverlay({
  game,
  onClose,
  showNotification = false,
  notificationMessage = ''
}: GameOverlayProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [showNotificationInternal, setShowNotificationInternal] = useState(false)

  // Show notification when prop changes
  useEffect(() => {
    console.log('GameOverlay props:', { showNotification, notificationMessage, game })
    if (showNotification) {
      console.log('🔔 SHOWING NOTIFICATION:', notificationMessage)
      setShowNotificationInternal(true)

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShowNotificationInternal(false)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      console.log('❌ showNotification is FALSE')
    }
  }, [showNotification, notificationMessage, game])

  // Debug internal state
  useEffect(() => {
    console.log('showNotificationInternal changed to:', showNotificationInternal)
  }, [showNotificationInternal])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // Capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose])

  if (!game) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop - semi-transparent with blur */}
      <div
        className="absolute inset-0 bg-dark-bg/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Game Container */}
      <div className={`
        relative z-10
        ${isMaximized ? 'w-full h-[95vh]' : game === 'codequest' ? 'w-[90vw] max-w-5xl h-[85vh]' : 'w-fit h-fit max-h-[95vh]'}
        flex flex-col
        transition-all duration-300
        neon-border
        rounded-lg
        bg-dark-bg
      `}>
        {/* Header Bar */}
        <div className="flex justify-between items-center bg-dark-card/90 p-2 border-b border-neon-cyan/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-neon-cyan font-mono text-xs neon-text flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <span>DEVPULSE ARCADE</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="
                px-2 py-1
                border border-neon-cyan/50
                bg-dark-card/80
                text-neon-cyan
                font-mono
                text-xs
                hover:bg-neon-cyan/10
                hover:border-neon-cyan
                transition-all
                rounded
                active:scale-95
              "
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? '▢' : '⛶'}
            </button>
            <button
              onClick={onClose}
              className="
                px-2 py-1
                border border-neon-magenta/50
                bg-dark-card/80
                text-neon-magenta
                font-mono
                text-xs
                hover:bg-neon-magenta/10
                hover:border-neon-magenta
                transition-all
                rounded
                active:scale-95
              "
            >
              ESC
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className={`flex-1 flex bg-dark-bg overflow-hidden ${game === 'codequest' ? 'w-full' : 'items-center justify-center'}`}>
          <GameNotificationContext.Provider value={{
            showNotification: showNotificationInternal,
            notificationMessage: notificationMessage
          }}>
            {game === 'snake' && <SnakeGame />}
            {game === 'minesweeper' && <Minesweeper />}
            {game === 'spaceinvaders' && <SpaceInvaders />}
            {game === 'codequest' && <CodeQuest />}
          </GameNotificationContext.Provider>
        </div>
      </div>
    </div>
  )
}
