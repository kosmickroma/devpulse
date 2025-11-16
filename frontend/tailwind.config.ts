import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Safelist all neon color variants for dynamic usage
    'border-neon-cyan', 'text-neon-cyan', 'bg-neon-cyan/10', 'shadow-neon-cyan',
    'border-neon-cyan/30', 'text-neon-cyan/40', 'border-neon-cyan/50', 'text-neon-cyan/60',
    'border-neon-magenta', 'text-neon-magenta', 'bg-neon-magenta/10', 'shadow-neon-magenta',
    'border-neon-magenta/30', 'text-neon-magenta/40', 'border-neon-magenta/50', 'text-neon-magenta/60',
    'border-neon-green', 'text-neon-green', 'bg-neon-green/10', 'shadow-neon-green',
    'border-neon-green/30', 'text-neon-green/40', 'border-neon-green/50', 'text-neon-green/60',
    'border-neon-orange', 'text-neon-orange', 'bg-neon-orange/10', 'shadow-neon-orange',
    'border-neon-orange/30', 'text-neon-orange/40', 'border-neon-orange/50', 'text-neon-orange/60',
    'border-neon-blue', 'text-neon-blue', 'bg-neon-blue/10', 'shadow-neon-blue',
    'border-neon-blue/30', 'text-neon-blue/40', 'border-neon-blue/50', 'text-neon-blue/60',
    'border-neon-purple', 'text-neon-purple', 'bg-neon-purple/10', 'shadow-neon-purple',
    'border-neon-purple/30', 'text-neon-purple/40', 'border-neon-purple/50', 'text-neon-purple/60',
  ],
  theme: {
    extend: {
      colors: {
        // 80s Sci-Fi Neon Palette
        neon: {
          cyan: '#00FFFF',
          magenta: '#FF00FF',
          purple: '#9D00FF',
          green: '#39FF14',
          pink: '#FF10F0',
          blue: '#00D9FF',
          orange: '#FF6600',
        },
        dark: {
          bg: '#0a0a0f',
          card: '#1a1a2e',
          hover: '#16213e',
          border: '#2a2a4e',
        },
        grid: '#1a1a3e',
      },
      fontFamily: {
        sans: ['var(--font-exo)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(157, 0, 255, 0.5), 0 0 40px rgba(157, 0, 255, 0.3)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3)',
        'neon-orange': '0 0 20px rgba(255, 102, 0, 0.5), 0 0 40px rgba(255, 102, 0, 0.3)',
        'neon-blue': '0 0 20px rgba(0, 217, 255, 0.5), 0 0 40px rgba(0, 217, 255, 0.3)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        'scanline': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
      },
    },
  },
  plugins: [],
}
export default config
