'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Widget from '@/components/Widget'
import { supabase } from '@/lib/supabase'

interface CommandWidgetProps {
  id: string
  settings: Record<string, any>
  onRemove?: () => void
  onSettings?: () => void
}

interface CommandHistory {
  command: string
  output: string
  timestamp: number
  type: 'success' | 'error' | 'synth'
}

const QUICK_COMMANDS = [
  { cmd: 'scan all', desc: 'Scan all sources' },
  { cmd: 'synth:', desc: 'Ask SYNTH AI' },
  { cmd: 'jobs', desc: 'Browse jobs' },
  { cmd: 'games', desc: 'Launch arcade' },
  { cmd: 'clear', desc: 'Clear history' },
]

export default function CommandWidget({
  id,
  settings,
  onRemove,
  onSettings
}: CommandWidgetProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState<typeof QUICK_COMMANDS>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Command suggestions based on input
  useEffect(() => {
    if (input.length > 0) {
      const filtered = QUICK_COMMANDS.filter(cmd =>
        cmd.cmd.toLowerCase().startsWith(input.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(input.toLowerCase())
      )
      setSuggestions(filtered)
      setSelectedSuggestion(0)
    } else {
      setSuggestions([])
    }
  }, [input])

  const executeCommand = useCallback(async (command: string) => {
    const trimmed = command.trim()
    if (!trimmed) return

    setIsProcessing(true)
    const timestamp = Date.now()

    try {
      // SYNTH mode
      if (trimmed.startsWith('synth:') || trimmed.startsWith('ai:')) {
        const query = trimmed.substring(trimmed.indexOf(':') + 1).trim()

        if (!query) {
          setHistory(prev => [{
            command: trimmed,
            output: `⚠️ Please ask a question after "synth:"`,
            timestamp,
            type: 'error'
          }, ...prev])
          setIsProcessing(false)
          return
        }

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setHistory(prev => [{
            command: trimmed,
            output: `⚠️ Authentication required. Please sign in to chat with SYNTH AI.`,
            timestamp,
            type: 'error'
          }, ...prev])
          setIsProcessing(false)
          return
        }

        // Add "thinking" message
        setHistory(prev => [{
          command: trimmed,
          output: `🤖 SYNTH is thinking...`,
          timestamp,
          type: 'synth'
        }, ...prev])

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ask`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ question: query })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'SYNTH is unavailable')
          }

          const data = await response.json()

          // Update the first history item with SYNTH's response
          setHistory(prev => prev.map((h, i) =>
            i === 0 ? {
              ...h,
              output: `🤖 SYNTH: ${data.response}\n\n💭 ${data.remaining} queries left today`
            } : h
          ))
        } catch (error: any) {
          setHistory(prev => prev.map((h, i) =>
            i === 0 ? {
              ...h,
              output: `⚠️ ${error.message}`,
              type: 'error' as const
            } : h
          ))
        }

        setIsProcessing(false)
        return
      }

      // Clear command
      if (trimmed === 'clear') {
        setHistory([])
        setIsProcessing(false)
        return
      }

      // Scan commands
      if (trimmed.startsWith('scan')) {
        setHistory(prev => [{
          command: trimmed,
          output: `🔄 Initiating scan... (Use full terminal for complete scan output)`,
          timestamp,
          type: 'success'
        }, ...prev])

        // Emit event for other widgets
        window.dispatchEvent(new CustomEvent('command-executed', {
          detail: { command: trimmed, source: 'command-widget' }
        }))

        setIsProcessing(false)
        return
      }

      // Jobs command
      if (trimmed === 'jobs') {
        window.location.href = '/jobs'
        setIsProcessing(false)
        return
      }

      // Games command
      if (trimmed === 'games' || trimmed === 'arcade') {
        window.location.href = '/arcade'
        setIsProcessing(false)
        return
      }

      // Default - command not recognized
      setHistory(prev => [{
        command: trimmed,
        output: `Command not found. Try: scan, synth:, jobs, games`,
        timestamp,
        type: 'error'
      }, ...prev])

    } catch (error) {
      setHistory(prev => [{
        command: trimmed,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        type: 'error'
      }, ...prev])
    }

    setIsProcessing(false)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter - execute command
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && selectedSuggestion < suggestions.length) {
        setInput(suggestions[selectedSuggestion].cmd)
        setSuggestions([])
      } else {
        executeCommand(input)
        setInput('')
        setHistoryIndex(-1)
      }
    }

    // Arrow Up - previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setSelectedSuggestion(Math.max(0, selectedSuggestion - 1))
      } else {
        const commandHistory = history.map(h => h.command)
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setInput(commandHistory[newIndex])
        }
      }
    }

    // Arrow Down - next command
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setSelectedSuggestion(Math.min(suggestions.length - 1, selectedSuggestion + 1))
      } else {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          const commandHistory = history.map(h => h.command)
          setInput(commandHistory[newIndex])
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          setInput('')
        }
      }
    }

    // Tab - autocomplete
    if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setInput(suggestions[selectedSuggestion].cmd)
        setSuggestions([])
      }
    }

    // Escape - clear suggestions
    if (e.key === 'Escape') {
      setSuggestions([])
      setSelectedSuggestion(0)
    }
  }

  return (
    <Widget
      id={id}
      title="⚡ COMMAND"
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="h-full flex flex-col font-mono text-sm">
        {/* Input Bar */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 bg-dark-bg/80 border-2 border-neon-cyan/50 rounded px-3 py-2 focus-within:border-neon-cyan focus-within:shadow-neon-cyan transition-all">
            <span className="text-neon-cyan">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type command or synth: question..."
              className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 text-sm"
              disabled={isProcessing}
            />
            {isProcessing && (
              <div className="w-3 h-3 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-dark-card border-2 border-neon-cyan/30 rounded overflow-hidden z-50">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.cmd}
                  onClick={() => {
                    setInput(suggestion.cmd)
                    setSuggestions([])
                    inputRef.current?.focus()
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                    index === selectedSuggestion
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'hover:bg-neon-cyan/10 text-gray-300'
                  }`}
                >
                  <span className="font-bold">{suggestion.cmd}</span>
                  <span className="text-xs text-gray-500">{suggestion.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Command History */}
        <div className="flex-1 overflow-auto space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-xs">
                Quick commands, SYNTH queries, instant results
              </div>
              <div className="text-xs mt-2 text-gray-600">
                Try: <span className="text-neon-cyan">synth: explain react</span>
              </div>
            </div>
          ) : (
            history.map((entry, index) => (
              <div
                key={entry.timestamp}
                className={`p-2 rounded border ${
                  entry.type === 'success'
                    ? 'border-neon-green/30 bg-neon-green/5'
                    : entry.type === 'synth'
                    ? 'border-neon-cyan/30 bg-neon-cyan/5'
                    : 'border-neon-magenta/30 bg-neon-magenta/5'
                }`}
                style={{
                  animation: `fadeIn 0.3s ease ${index * 0.05}s both`
                }}
              >
                <div className={`text-xs mb-1 ${
                  entry.type === 'success'
                    ? 'text-neon-green'
                    : entry.type === 'synth'
                    ? 'text-neon-cyan'
                    : 'text-neon-magenta'
                }`}>
                  {'>'} {entry.command}
                </div>
                <div className="text-xs text-gray-300">{entry.output}</div>
              </div>
            ))
          )}
        </div>

        {/* Status Bar */}
        <div className="mt-3 pt-2 border-t border-neon-cyan/20 flex items-center justify-between text-xs text-gray-500">
          <span>↑↓ History | Tab Complete | Ctrl+~ Full Terminal</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></span>
            READY
          </span>
        </div>
      </div>
    </Widget>
  )
}
