import type { Metadata } from 'next'
import { Exo_2, Space_Mono } from 'next/font/google'
import './globals.css'
import '../styles/synth-effects.css'

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo',
  weight: ['400', '600', '700', '900'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'DevPulse | Track the Pulse of Developer Trends',
  description: '80s sci-fi inspired dashboard for tracking trending developer content across GitHub, Hacker News, Dev.to, and more.',
  keywords: ['developer trends', 'github trending', 'hacker news', 'dev.to', 'tech trends'],
  icons: {
    icon: '/devpulse_icon.svg',
    shortcut: '/devpulse_icon.svg',
    apple: '/devpulse_icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/devpulse_icon.svg" type="image/svg+xml" />
      </head>
      <body className={`${exo2.variable} ${spaceMono.variable} font-sans`}>
        {/* CRT Effects */}
        <div className="scanline" />

        {/* Main Content */}
        <div className="relative min-h-screen grid-bg">
          {children}
        </div>
      </body>
    </html>
  )
}
