'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

type Cell = {
  north: boolean
  south: boolean
  east: boolean
  west: boolean
  visited: boolean
}

export default function AmazingGame() {
  const [mazeWidth, setMazeWidth] = useState<number>(10)
  const [mazeHeight, setMazeHeight] = useState<number>(10)
  const [maze, setMaze] = useState<Cell[][] | null>(null)
  const [gameState, setGameState] = useState<'input' | 'generating' | 'display'>('input')
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<'width' | 'height' | 'again'>('width')
  const terminalRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
      }, 0)
    }
  }, [output])

  useEffect(() => {
    addOutput('AMAZING - MAZE GENERATOR')
    addOutput('CREATIVE COMPUTING, MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('THIS PROGRAM GENERATES RANDOM MAZES USING')
    addOutput('A DEPTH-FIRST SEARCH ALGORITHM.')
    addOutput('')
    addOutput('ENTER THE WIDTH OF YOUR MAZE (5-30):')
  }, [])

  useEffect(() => {
    if (maze && canvasRef.current) {
      drawMaze()
    }
  }, [maze])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const generateMaze = (width: number, height: number): Cell[][] => {
    const grid: Cell[][] = []

    // Initialize grid
    for (let y = 0; y < height; y++) {
      grid[y] = []
      for (let x = 0; x < width; x++) {
        grid[y][x] = {
          north: true,
          south: true,
          east: true,
          west: true,
          visited: false
        }
      }
    }

    // Depth-first search maze generation
    const stack: [number, number][] = []
    const startX = Math.floor(Math.random() * width)
    const startY = Math.floor(Math.random() * height)

    stack.push([startX, startY])
    grid[startY][startX].visited = true

    while (stack.length > 0) {
      const [x, y] = stack[stack.length - 1]
      const neighbors: [number, number, string][] = []

      // Check all neighbors
      if (y > 0 && !grid[y - 1][x].visited) {
        neighbors.push([x, y - 1, 'north'])
      }
      if (y < height - 1 && !grid[y + 1][x].visited) {
        neighbors.push([x, y + 1, 'south'])
      }
      if (x > 0 && !grid[y][x - 1].visited) {
        neighbors.push([x - 1, y, 'west'])
      }
      if (x < width - 1 && !grid[y][x + 1].visited) {
        neighbors.push([x + 1, y, 'east'])
      }

      if (neighbors.length > 0) {
        // Choose random neighbor
        const [nx, ny, direction] = neighbors[Math.floor(Math.random() * neighbors.length)]

        // Remove walls
        if (direction === 'north') {
          grid[y][x].north = false
          grid[ny][nx].south = false
        } else if (direction === 'south') {
          grid[y][x].south = false
          grid[ny][nx].north = false
        } else if (direction === 'east') {
          grid[y][x].east = false
          grid[ny][nx].west = false
        } else if (direction === 'west') {
          grid[y][x].west = false
          grid[ny][nx].east = false
        }

        grid[ny][nx].visited = true
        stack.push([nx, ny])
      } else {
        stack.pop()
      }
    }

    return grid
  }

  const drawMaze = () => {
    const canvas = canvasRef.current
    if (!canvas || !maze) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellSize = Math.min(
      Math.floor(canvas.width / mazeWidth),
      Math.floor(canvas.height / mazeHeight)
    )

    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw maze
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2

    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        const cell = maze[y][x]
        const px = x * cellSize
        const py = y * cellSize

        // Draw walls
        if (cell.north) {
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + cellSize, py)
          ctx.stroke()
        }
        if (cell.south) {
          ctx.beginPath()
          ctx.moveTo(px, py + cellSize)
          ctx.lineTo(px + cellSize, py + cellSize)
          ctx.stroke()
        }
        if (cell.west) {
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px, py + cellSize)
          ctx.stroke()
        }
        if (cell.east) {
          ctx.beginPath()
          ctx.moveTo(px + cellSize, py)
          ctx.lineTo(px + cellSize, py + cellSize)
          ctx.stroke()
        }
      }
    }

    // Mark entrance and exit
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(2, 2, 8, 8) // Entrance (top-left)
    ctx.fillRect((mazeWidth - 1) * cellSize + cellSize - 10, (mazeHeight - 1) * cellSize + cellSize - 10, 8, 8) // Exit (bottom-right)
  }

  const handleInput = (value: string) => {
    const num = parseInt(value.trim())

    addOutput(`> ${value}`)

    if (inputMode === 'width') {
      if (isNaN(num) || num < 5 || num > 30) {
        addOutput('PLEASE ENTER A NUMBER BETWEEN 5 AND 30.')
        return
      }
      setMazeWidth(num)
      setInputMode('height')
      addOutput('ENTER THE HEIGHT OF YOUR MAZE (5-30):')
    } else if (inputMode === 'height') {
      if (isNaN(num) || num < 5 || num > 30) {
        addOutput('PLEASE ENTER A NUMBER BETWEEN 5 AND 30.')
        return
      }
      setMazeHeight(num)
      setGameState('generating')
      addOutput('')
      addOutput(`GENERATING ${mazeWidth}x${num} MAZE...`)
      addOutput('USING DEPTH-FIRST SEARCH ALGORITHM...')

      setTimeout(() => {
        const newMaze = generateMaze(mazeWidth, num)
        setMaze(newMaze)
        setGameState('display')
        addOutput('MAZE GENERATED!')
        addOutput('')
        addOutput('GREEN DOT = ENTRANCE (TOP-LEFT)')
        addOutput('GREEN DOT = EXIT (BOTTOM-RIGHT)')
        addOutput('')
        addOutput('GENERATE ANOTHER MAZE? (YES/NO)')
        setInputMode('again')

        // Submit score based on maze complexity (width * height)
        const score = mazeWidth * num
        submitScore({
          gameId: 'amazing',
          score,
          metadata: {
            width: mazeWidth,
            height: num,
            complexity: score
          }
        }).catch(err => console.error('Failed to submit score:', err))
      }, 500)
    } else if (inputMode === 'again') {
      const answer = value.trim().toUpperCase()

      if (answer === 'YES' || answer === 'Y') {
        setMaze(null)
        setGameState('input')
        setInputMode('width')
        addOutput('')
        addOutput('ENTER THE WIDTH OF YOUR MAZE (5-30):')
      } else {
        addOutput('')
        addOutput('THANKS FOR USING AMAZING!')
        addOutput('PRESS ESC TO EXIT.')
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleInput(currentInput)
      setCurrentInput('')
    }
  }

  return (
    <div className="w-full h-full bg-black p-6 overflow-hidden flex">
      {/* Left panel - Terminal */}
      <div className="w-1/3 pr-4 flex flex-col border-r border-green-700">
        <div className="mb-4 pb-2 border-b border-green-700">
          <h2 className="text-green-400 font-mono text-xl">AMAZING</h2>
          <p className="text-green-600 text-sm">Maze Generator #23 (1972)</p>
        </div>

        <div
          ref={terminalRef}
          className="flex-1 font-mono text-sm text-green-500 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-black"
        >
          {output.map((line, i) => (
            <div key={i} className={line.startsWith('>') ? 'text-green-300' : 'text-green-500'}>
              {line}
            </div>
          ))}
        </div>

        <div className="flex items-center border-t border-green-700 pt-2">
          <span className="text-yellow-500 mr-2">&gt;</span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-green-400 font-mono"
            placeholder="Enter value..."
            autoFocus
            disabled={gameState === 'generating'}
          />
        </div>
      </div>

      {/* Right panel - Maze Display */}
      <div className="w-2/3 pl-4 flex flex-col items-center justify-center">
        {maze ? (
          <>
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="border-2 border-green-500"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="mt-4 text-green-600 text-sm font-mono text-center">
              {mazeWidth} × {mazeHeight} maze | Depth-first search algorithm
            </div>
          </>
        ) : (
          <div className="text-green-700 text-center font-mono">
            <div className="text-6xl mb-4">🌀</div>
            <div className="text-lg">Enter maze dimensions to begin</div>
          </div>
        )}
      </div>
    </div>
  )
}

// Original BASIC concept (simplified):
/*
The original AMAZING program from 1972 used a similar maze generation
algorithm. It would print ASCII mazes to paper terminals.

Our version uses:
- Depth-first search with backtracking
- Canvas API for visual rendering
- Interactive terminal interface
- Entrance/exit markers
*/
