'use client'

import { useState, useEffect } from 'react'

interface DemoModeProps {
  onQuery: (query: string) => void
  isActive: boolean
}

export default function DemoMode({ onQuery, isActive }: DemoModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [demos, setDemos] = useState<string[]>([])
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Fetch demo queries on mount
  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/ai/demo/queries`)
        const data = await response.json()
        setDemos(data.queries || [])
      } catch (error) {
        console.error('Failed to fetch demo queries:', error)
      }
    }

    fetchDemos()
  }, [])

  // Auto-play demo sequence when active
  useEffect(() => {
    if (!isActive || demos.length === 0) return

    const runDemo = async () => {
      const query = demos[currentIndex]

      // Type out the query
      setIsTyping(true)
      for (let i = 0; i <= query.length; i++) {
        setTypedText(query.slice(0, i))
        await new Promise(resolve => setTimeout(resolve, 50)) // Typing speed
      }
      setIsTyping(false)

      // Execute the query
      onQuery(query)

      // Wait before next demo
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Move to next demo (loop)
      setCurrentIndex((prev) => (prev + 1) % demos.length)
    }

    runDemo()
  }, [isActive, currentIndex, demos, onQuery])

  if (!isActive) return null

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 border border-neon-cyan px-4 py-2 rounded font-mono text-sm">
      <div className="flex items-center gap-2">
        <span className="text-neon-cyan">🤖 DEMO MODE:</span>
        <span className="text-white">{typedText}</span>
        {isTyping && <span className="animate-pulse text-neon-cyan">_</span>}
      </div>
    </div>
  )
}
