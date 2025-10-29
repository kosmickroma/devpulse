'use client'

interface FilterBarProps {
  selectedSource: string
  onSourceChange: (source: string) => void
}

const sources = [
  { id: 'all', label: 'ALL', color: 'cyan' },
  { id: 'github', label: 'GITHUB', color: 'cyan' },
  { id: 'hackernews', label: 'HACKER NEWS', color: 'magenta' },
  { id: 'devto', label: 'DEV.TO', color: 'green' },
]

export default function FilterBar({ selectedSource, onSourceChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center py-6">
      <span className="text-gray-400 font-mono text-sm mr-2">&gt; FILTER BY:</span>
      {sources.map(source => {
        const isSelected = selectedSource === source.id
        const colorClasses = {
          cyan: 'border-neon-cyan text-neon-cyan shadow-neon-cyan',
          magenta: 'border-neon-magenta text-neon-magenta shadow-neon-magenta',
          green: 'border-neon-green text-neon-green shadow-neon-green',
        }

        return (
          <button
            key={source.id}
            onClick={() => onSourceChange(source.id)}
            className={`
              px-6 py-2 border-2 rounded font-mono text-sm font-bold
              transition-all duration-300 hover:scale-105
              ${isSelected
                ? `${colorClasses[source.color as keyof typeof colorClasses]} bg-opacity-20`
                : 'border-dark-border text-gray-400 hover:border-neon-cyan/50'
              }
            `}
          >
            {source.label}
          </button>
        )
      })}
    </div>
  )
}
