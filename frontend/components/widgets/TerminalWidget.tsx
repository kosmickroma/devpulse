'use client'

import { useState } from 'react'
import Widget from '@/components/Widget'
import InteractiveTerminal from '@/components/InteractiveTerminal'

interface TerminalWidgetProps {
  id: string
  settings: Record<string, any>
  onRemove?: () => void
  onSettings?: () => void
}

export default function TerminalWidget({
  id,
  settings,
  onRemove,
  onSettings
}: TerminalWidgetProps) {
  const [, setTrends] = useState<any[]>([])
  const selectedSources = settings.selectedSources || []

  const handleDataReceived = (items: any[]) => {
    setTrends(items)
    // Emit event that other widgets can listen to
    window.dispatchEvent(new CustomEvent('trends-updated', { detail: items }))
  }

  return (
    <Widget
      id={id}
      title="📟 TERMINAL"
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="h-full overflow-hidden">
        <InteractiveTerminal
          onDataReceived={handleDataReceived}
          selectedSources={selectedSources}
        />
      </div>
    </Widget>
  )
}
