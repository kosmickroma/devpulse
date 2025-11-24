/**
 * Demo Helper Utilities
 * Functions for auto-demo typing animations and timing
 */

/**
 * Sleep helper for async timing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Simulate typing animation with character-by-character display
 * @param text - Text to type
 * @param onChar - Callback for each character typed
 * @param speed - Typing speed in WPM (default 60 WPM = ~100ms per char)
 */
export async function simulateTyping(
  text: string,
  onChar: (char: string) => void,
  speed: number = 60
): Promise<void> {
  // Convert WPM to ms per character
  // 60 WPM ≈ 5 chars per second = 200ms per char (accounting for words)
  // Adjusted to feel natural: 60 WPM = ~100ms per char
  const msPerChar = (60 / speed) * 1000 / 5

  const chars = text.split('')

  for (const char of chars) {
    onChar(char)
    await sleep(msPerChar)
  }
}

/**
 * Type a complete command with cursor simulation
 * @param text - Command to type
 * @param onUpdate - Callback for each update to the input display
 * @param onComplete - Callback when typing completes
 * @param speed - Typing speed in WPM
 */
export async function typeCommand(
  text: string,
  onUpdate: (currentText: string) => void,
  onComplete: () => void,
  speed: number = 60
): Promise<void> {
  let currentText = ''

  await simulateTyping(
    text,
    (char) => {
      currentText += char
      onUpdate(currentText)
    },
    speed
  )

  onComplete()
}

/**
 * Display items with staggered timing (for cached burst)
 * @param items - Array of items to display
 * @param onItem - Callback for each item
 * @param delayMs - Delay between items in milliseconds
 */
export async function displayItemsBurst(
  items: any[],
  onItem: (item: any) => void,
  delayMs: number = 2
): Promise<void> {
  for (const item of items) {
    onItem(item)
    await sleep(delayMs)
  }
}

/**
 * Format demo timing constants
 */
export const DEMO_TIMING = {
  SCROLL_TO_CENTER: 800,      // Time to scroll terminal to center
  BOOT_SOUND_DELAY: 100,      // Delay before playing boot sound
  TYPING_SPEED_WPM: 60,       // Typing speed (words per minute)
  CACHED_BURST_DELAY: 2,      // Delay between cached items (ms)
  STATUS_MESSAGE_DELAY: 100,  // Delay before showing status messages
  SYNTH_ACTIVATION_DELAY: 500, // Delay before activating SYNTH mode
  COMPLETION_MESSAGE_DELAY: 1000, // Delay before showing completion message
}

/**
 * Demo sequence steps
 */
export const DEMO_STEPS = {
  IDLE: 'idle',
  SCROLLING: 'scrolling',
  BOOTING: 'booting',
  TYPING_INIT: 'typing_init',
  TYPING_SCAN: 'typing_scan',
  EXECUTING_SCAN: 'executing_scan',
  CACHED_BURST: 'cached_burst',
  FRESH_SCAN: 'fresh_scan',
  TYPING_SYNTH: 'typing_synth',
  SYNTH_ACTIVATION: 'synth_activation',
  SYNTH_SEARCH: 'synth_search',
  COMPLETE: 'complete'
} as const

export type DemoStep = typeof DEMO_STEPS[keyof typeof DEMO_STEPS]
