import { useEffect, useRef, useState } from 'react'

export type SoundType = 'typing' | 'beep' | 'error' | 'success'

export function useTerminalSounds() {
  const [audioEnabled, setAudioEnabled] = useState(false)

  const sounds = useRef({
    typing: null as HTMLAudioElement | null,
    beep: null as HTMLAudioElement | null,
    error: null as HTMLAudioElement | null,
    success: null as HTMLAudioElement | null,
  })

  // Initialize sounds on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sounds.current = {
        typing: new Audio('/sounds/ui_hacking_charenter_01.wav'),
        beep: new Audio('/sounds/ui_hacking_charscroll.wav'),
        error: new Audio('/sounds/ui_hacking_passbad.wav'),
        success: new Audio('/sounds/ui_hacking_passgood.wav'),
      }

      // Preload and set volume
      Object.values(sounds.current).forEach(sound => {
        if (sound) {
          sound.volume = 0.3
          sound.load()
        }
      })
    }
  }, [])

  // Enable audio on first user interaction
  const enableAudio = async () => {
    if (sounds.current.beep) {
      try {
        const beep = sounds.current.beep
        const originalVolume = beep.volume
        beep.volume = 0
        await beep.play()
        beep.pause()
        beep.currentTime = 0
        beep.volume = originalVolume
        setAudioEnabled(true)
      } catch (error) {
        console.warn('Audio unlock failed:', error)
      }
    }
  }

  // Play sound helper
  const playSound = (soundType: SoundType) => {
    if (!audioEnabled || !sounds.current[soundType]) return

    const sound = sounds.current[soundType]
    if (sound) {
      sound.currentTime = 0 // Reset to start
      sound.play().catch(() => {}) // Ignore errors
    }
  }

  return {
    audioEnabled,
    enableAudio,
    playSound,
  }
}
