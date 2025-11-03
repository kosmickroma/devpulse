# DevPulse Mini-Games Development Guide

This guide is for building modular terminal games that integrate seamlessly into the DevPulse terminal interface.

## Architecture Overview

Each game is a **separate React component** that follows a standard interface. Games are stored in `frontend/components/games/` and can be imported and plugged into the terminal without modifying core terminal code.

## Project Context

**Tech Stack:**
- Next.js 14 + React + TypeScript
- Tailwind CSS
- 80s Synthwave/Neon aesthetic

**Color Palette:**
- Neon Cyan: `#00ffff` (primary)
- Neon Green: `#00ff00` (success)
- Neon Magenta: `#ff00ff` (error/accent)
- Dark Background: `#0a0a0a`
- Dark Card: `#1a1a1a`

**Fonts:**
- All games use monospace fonts to match terminal aesthetic

## Standard Game Interface

Every game component MUST implement this interface:

```typescript
// File: frontend/components/games/GameInterface.ts

export interface GameProps {
  onExit: () => void;           // Called when user exits game (ESC key)
  onScoreUpdate: (score: number) => void;  // Called when score changes
  isActive: boolean;            // Whether game is currently active/visible
}

export interface GameMetadata {
  name: string;                 // Game name (e.g., "Snake")
  command: string;              // Command to launch (e.g., "snake")
  description: string;          // Short description
  highScoreKey: string;         // localStorage key for high score
}
```

## Game Component Template

```typescript
// File: frontend/components/games/SnakeGame.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameProps, GameMetadata } from './GameInterface'

export const SnakeMetadata: GameMetadata = {
  name: 'Snake',
  command: 'snake',
  description: 'Classic snake game - eat food, grow longer, avoid walls',
  highScoreKey: 'devpulse_snake_highscore'
}

export default function SnakeGame({ onExit, onScoreUpdate, isActive }: GameProps) {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // Game logic here...

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
      }
    }

    if (isActive) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onExit])

  // Update score
  useEffect(() => {
    onScoreUpdate(score)
  }, [score, onScoreUpdate])

  return (
    <div className="fixed inset-0 z-40 bg-dark-bg/95 backdrop-blur-md flex items-center justify-center">
      <div className="max-w-4xl w-full p-6">
        {/* Game header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-neon-cyan font-mono">SNAKE</h2>
          <p className="text-sm text-gray-400 font-mono">ESC to exit | Score: {score}</p>
        </div>

        {/* Game canvas/grid */}
        <div className="border-2 border-neon-cyan rounded-lg p-4 bg-dark-card">
          {/* Your game rendering here */}
        </div>

        {/* Game over screen */}
        {gameOver && (
          <div className="text-center mt-4">
            <p className="text-neon-magenta font-mono text-xl">GAME OVER</p>
            <p className="text-gray-300 font-mono">Press SPACE to restart or ESC to exit</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

## Integration with Terminal

Games are registered and launched from the terminal:

```typescript
// File: frontend/components/InteractiveTerminal.tsx (snippet)

import SnakeGame, { SnakeMetadata } from './games/SnakeGame'
import BreakoutGame, { BreakoutMetadata } from './games/BreakoutGame'

// Register games
const GAMES = [SnakeMetadata, BreakoutMetadata]

// In component:
const [activeGame, setActiveGame] = useState<string | null>(null)
const [gameScore, setGameScore] = useState(0)

// In command handler:
case 'game':
  const gameName = args[0]
  const game = GAMES.find(g => g.command === gameName)
  if (game) {
    setActiveGame(gameName)
  } else {
    addLine(`Game not found: ${gameName}`, 'error')
  }
  break

case 'games':
  addLine('Available games:', 'output')
  GAMES.forEach(g => {
    addLine(`  ${g.command} - ${g.description}`, 'output')
  })
  break

// Render active game:
{activeGame === 'snake' && (
  <SnakeGame
    onExit={() => setActiveGame(null)}
    onScoreUpdate={setGameScore}
    isActive={true}
  />
)}
```

## Game Requirements

### Must Have:
1. **ESC key exits** - Always return to terminal
2. **Score tracking** - Call `onScoreUpdate(score)` when score changes
3. **High score** - Save to localStorage using the `highScoreKey`
4. **Responsive design** - Works on different screen sizes
5. **Neon theme** - Use project color palette (cyan, green, magenta)
6. **Monospace font** - Matches terminal aesthetic
7. **Sound effects** - Classic arcade sounds (provide sound file paths)

### Nice to Have:
1. Pause functionality (P key)
2. Instructions overlay on first play
3. Difficulty levels
4. Animations/transitions

## Sound Files

Place sound files in: `frontend/public/sounds/games/[game-name]/`

Example:
```
frontend/public/sounds/games/snake/
  - eat.wav          (when snake eats food)
  - game-over.wav    (when game ends)
  - move.wav         (optional: subtle movement sound)
```

Load sounds in game component:
```typescript
const sounds = {
  eat: new Audio('/sounds/games/snake/eat.wav'),
  gameOver: new Audio('/sounds/games/snake/game-over.wav')
}

// Set volume
sounds.eat.volume = 0.3
```

## Styling Guidelines

Use Tailwind classes that match the terminal:

```css
/* Neon borders */
border-2 border-neon-cyan

/* Neon glow effect */
shadow-[0_0_10px_rgba(0,255,255,0.5)]

/* Background */
bg-dark-bg         /* #0a0a0a */
bg-dark-card       /* #1a1a1a */

/* Text colors */
text-neon-cyan     /* #00ffff */
text-neon-green    /* #00ff00 */
text-neon-magenta  /* #ff00ff */
text-gray-300      /* Normal text */
text-gray-500      /* Subtle text */

/* Font */
font-mono
```

## Testing Checklist

Before submitting a game:
- [ ] ESC key exits to terminal
- [ ] Score updates correctly
- [ ] High score saves to localStorage
- [ ] Sounds play at appropriate times
- [ ] Game over state works
- [ ] Restart works
- [ ] Fits neon/synthwave theme
- [ ] Responsive (works on mobile)
- [ ] No TypeScript errors
- [ ] Comments explain game logic

## Example Games to Build

### 1. Snake
- Grid-based (20x20 or 30x30)
- Arrow keys or WASD to move
- Food appears randomly
- Grow on eating, die on collision
- Speed increases with score

### 2. Breakout/Brick Breaker
- Paddle at bottom (mouse or arrow keys)
- Ball bounces off walls, paddle, bricks
- Different brick colors = different points
- Multiple levels with different brick patterns
- Lives system (3 lives)

### 3. Minefield/Minesweeper
- Classic grid (beginner: 9x9, 10 mines)
- Left click to reveal, right click to flag
- Number shows adjacent mines
- First click never a mine
- Timer and mine counter

### 4. Pong
- Two-player or vs AI
- Paddle controls (W/S for P1, Arrow keys for P2)
- Ball speed increases on each hit
- First to 11 wins
- AI difficulty setting

## File Structure

```
frontend/
├── components/
│   ├── games/
│   │   ├── GameInterface.ts         (interfaces)
│   │   ├── SnakeGame.tsx
│   │   ├── BreakoutGame.tsx
│   │   ├── MinefieldGame.tsx
│   │   └── PongGame.tsx
│   └── InteractiveTerminal.tsx
├── public/
│   └── sounds/
│       └── games/
│           ├── snake/
│           ├── breakout/
│           ├── minefield/
│           └── pong/
```

## Development Workflow

1. **Create game component** in `frontend/components/games/[GameName].tsx`
2. **Implement GameInterface** (props, metadata)
3. **Build game logic** with React hooks
4. **Style with Tailwind** using neon theme
5. **Add sounds** to `/public/sounds/games/[game-name]/`
6. **Test thoroughly** (especially ESC exit, score tracking)
7. **Export metadata** for terminal registration
8. **Ready to plug in!**

## Questions to Ask Your AI Assistant

When working with Gemini/ChatGPT, ask them to:
1. "Build a [Game Name] component following this GameInterface"
2. "Use the neon color palette and monospace fonts"
3. "Implement ESC key exit and score tracking"
4. "Add classic arcade sound effects"
5. "Make it responsive and match the terminal aesthetic"
6. "Help me understand [specific game logic concept]"
7. "Review my code for TypeScript errors"

## Tips

- **Start simple** - Get basic gameplay working first, then add polish
- **Test frequently** - Make sure ESC exit works at every stage
- **Use refs for game state** - Avoid re-renders killing performance
- **requestAnimationFrame** - For smooth animations
- **Canvas vs DOM** - Canvas for complex graphics, DOM for simple games
- **Sound preloading** - Load sounds on component mount
- **localStorage** - Remember to parse/stringify JSON for high scores

---

**Ready to build?** Pick a game and start coding! Each game is independent, so you can work on them one at a time and plug them in when ready.

**Questions?** Refer back to this guide or ask your AI assistant to clarify any section.
