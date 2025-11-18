# Vault Games Sound Implementation Guide

## Sound Types

- **typing**: When user presses Enter (every input)
- **beep**: General feedback, hints, neutral responses
- **error**: Wrong answers, invalid input, crashes, failures
- **success**: Correct answers, wins, level complete, good outcomes

## Implementation Pattern

### 1. Add Import
```typescript
import { useTerminalSounds } from '@/hooks/useTerminalSounds'
```

### 2. Add Hook
```typescript
const { playSound, enableAudio } = useTerminalSounds()
```

### 3. Enable Audio on Mount
```typescript
useEffect(() => {
  enableAudio() // Add this first
  // ... rest of initialization
}, [])
```

### 4. Add Sound Calls

**Every handleInput/handleKeyPress:**
```typescript
playSound('typing') // At start of input handler
```

**On Success/Win:**
```typescript
playSound('success')
```

**On Error/Failure:**
```typescript
playSound('error')
```

**On Neutral Feedback:**
```typescript
playSound('beep')
```

## Game-Specific Sound Placements

### GuessGame ✅ (DONE)
- typing: On every guess
- success: Correct guess
- error: Invalid input (NaN)
- beep: Too high/low hints, play again prompt

### BagelsGame
- typing: On every guess
- success: Correct (FERMI! YOU GOT IT!)
- error: Invalid input
- beep: PICO/FERMI/BAGELS hints

### NimGame
- typing: On move
- success: Player wins
- error: Invalid move, computer wins
- beep: Computer's turn, pile updates

### AmazingGame
- typing: On input (maze size)
- success: Maze generated
- error: Invalid size
- beep: Each line of maze output

### StockGame
- typing: On trade input
- success: Profitable trade, game won
- error: Invalid trade, bankruptcy
- beep: Market updates, stock prices

### OregonGame
- typing: On input
- success: Reach Oregon alive
- error: Death, ran out of supplies
- beep: Random events, status updates

### StarTrekGame
- typing: On command
- success: Enemy destroyed, mission complete
- error: Ship destroyed, invalid command
- beep: Status updates, movement

### Blackjack
- typing: On bet/action
- success: Blackjack, win hand
- error: Bust
- beep: Card dealt, dealer turn

### Hammurabi
- typing: On resource decision
- success: Year complete, 10 years survived
- error: Impeachment, too many deaths
- beep: Year start, status reports

### Lunar
- typing: On burn input
- success: Safe landing
- error: Crash
- beep: Flight status updates

## Status

- [x] GuessGame
- [ ] BagelsGame
- [ ] NimGame
- [ ] AmazingGame
- [ ] StockGame
- [ ] OregonGame
- [ ] StarTrekGame
- [ ] Blackjack
- [ ] Hammurabi
- [ ] Lunar

## Testing Checklist

After implementation:
- [ ] Sounds play correctly for each action
- [ ] No sound overlap/stutter
- [ ] Volume is appropriate (0.3)
- [ ] Sounds enhance experience without being annoying
