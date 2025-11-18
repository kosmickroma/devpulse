#!/bin/bash

# Script to add terminal sounds to all vault games

GAMES=(
  "BagelsGame"
  "NimGame"
  "AmazingGame"
  "StockGame"
  "OregonGame"
  "StarTrekGame"
  "Blackjack"
  "Hammurabi"
  "Lunar"
)

for game in "${GAMES[@]}"; do
  file="/mnt/c/Users/carol/devpulse/frontend/components/games/basic/${game}.tsx"

  echo "Processing $game..."

  # 1. Add import for useTerminalSounds
  sed -i "s/import { submitScore } from '@\/lib\/arcade'/import { submitScore } from '@\/lib\/arcade'\nimport { useTerminalSounds } from '@\/hooks\/useTerminalSounds'/g" "$file"

  # 2. Add hook declaration (after terminalRef line)
  sed -i "s/const terminalRef = useRef<HTMLDivElement>(null)/const terminalRef = useRef<HTMLDivElement>(null)\n  const { playSound, enableAudio } = useTerminalSounds()/g" "$file"

  # 3. Add enableAudio() in first useEffect
  # This is trickier - we'll add it at the start of the initialization useEffect

done

echo "Done! Please review changes and add sound calls manually where appropriate."
