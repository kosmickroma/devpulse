'use client'

export default function Footer() {
  return (
    <footer className="border-t-2 border-neon-cyan/30 bg-dark-bg mt-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/devpulse_icon.svg"
                alt="DevPulse"
                className="w-12 h-12"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.5))',
                }}
              />
              <span className="font-mono font-bold text-2xl">
                <span className="text-neon-magenta neon-text-magenta">Dev</span>
                <span className="text-neon-cyan neon-text">Pulse</span>
              </span>
            </div>
            <p className="text-gray-400 font-mono text-sm max-w-md">
              Track the pulse of developer trends across GitHub, Hacker News, Dev.to, and more.
              Stay ahead of the curve with real-time insights powered by AI.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-mono font-bold text-neon-cyan mb-4">EXPLORE</h3>
            <ul className="space-y-2 font-mono text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-magenta transition-colors">
                  Trending Now
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-magenta transition-colors">
                  Sources
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-magenta transition-colors">
                  API Docs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-magenta transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-mono font-bold text-neon-magenta mb-4">CONNECT</h3>
            <ul className="space-y-2 font-mono text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-dark-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 font-mono text-sm">
            © 2025 DevPulse. All rights reserved.
          </p>
          <div className="flex gap-4 font-mono text-sm">
            <a href="#" className="text-gray-500 hover:text-neon-green transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-neon-green transition-colors">
              Terms
            </a>
            <a href="#" className="text-gray-500 hover:text-neon-green transition-colors">
              License
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
