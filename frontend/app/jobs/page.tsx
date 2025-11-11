'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'

interface Company {
  id: string
  name: string
  career_url: string
  size: 'large' | 'medium' | 'startup'
  categories: string[]
  tech_stack: string[]
  locations: string[]
  description?: string
}

interface JobsData {
  companies: Company[]
  metadata: {
    last_updated: string
    total_companies: number
  }
}

export default function JobsPage() {
  const [jobsData, setJobsData] = useState<JobsData | null>(null)
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSize, setSelectedSize] = useState<string>('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/jobs.json')
      .then(res => res.json())
      .then(data => {
        setJobsData(data)
        setFilteredCompanies(data.companies)
      })
  }, [])

  useEffect(() => {
    if (!jobsData) return

    let filtered = jobsData.companies

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(term) ||
        company.description?.toLowerCase().includes(term) ||
        company.tech_stack?.some(tech => tech.toLowerCase().includes(term)) ||
        company.categories?.some(cat => cat.toLowerCase().includes(term))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(company =>
        company.categories?.includes(selectedCategory)
      )
    }

    // Filter by size
    if (selectedSize !== 'all') {
      filtered = filtered.filter(company => company.size === selectedSize)
    }

    setFilteredCompanies(filtered)
  }, [searchTerm, selectedCategory, selectedSize, jobsData])

  const categories = [
    { id: 'all', label: 'All Companies' },
    { id: 'FAANG', label: 'FAANG' },
    { id: 'big-tech', label: 'Big Tech' },
    { id: 'startup', label: 'Startups' },
    { id: 'remote-friendly', label: 'Remote-Friendly' },
    { id: 'visa-sponsor', label: 'Visa Sponsors' },
    { id: 'intern-program', label: 'Internships' },
    { id: 'new-grad', label: 'New Grad' },
  ]

  const sizes = [
    { id: 'all', label: 'All Sizes' },
    { id: 'large', label: 'Large (1000+)' },
    { id: 'medium', label: 'Medium (100-1000)' },
    { id: 'startup', label: 'Startup (<100)' },
  ]

  return (
    <main className="min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-2 border-neon-cyan/30 py-12">
        <div className="absolute inset-0 perspective-grid opacity-20" style={{ height: '200px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-neon-cyan neon-text-cyan mb-4 font-mono">
            TECH JOBS DIRECTORY
          </h1>
          <p className="text-xl text-neon-green neon-text-green font-mono mb-6">
            &gt; {jobsData?.metadata.total_companies || 100}+ COMPANIES HIRING DEVELOPERS
          </p>
          <a
            href="/jobs/submit"
            className="
              inline-block px-6 py-3
              border-2 border-neon-magenta rounded
              text-neon-magenta font-mono text-sm font-bold
              hover:bg-neon-magenta/10
              transition-all
            "
          >
            + SUBMIT A COMPANY
          </a>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="neon-border rounded-lg p-6 bg-dark-card/90 backdrop-blur mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-neon-cyan font-mono text-sm mb-2">SEARCH</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Company name, tech stack, or keyword..."
              className="
                w-full px-4 py-3
                bg-dark-hover border-2 border-neon-cyan/30 rounded
                text-gray-200 font-mono
                focus:border-neon-cyan focus:outline-none
                transition-colors
              "
            />
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <label className="block text-neon-magenta font-mono text-sm mb-2">CATEGORY</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    px-4 py-2 border-2 rounded font-mono text-sm
                    transition-all
                    ${selectedCategory === cat.id
                      ? 'border-neon-magenta bg-neon-magenta/20 text-neon-magenta'
                      : 'border-neon-magenta/30 text-gray-400 hover:border-neon-magenta/60'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-neon-green font-mono text-sm mb-2">COMPANY SIZE</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={`
                    px-4 py-2 border-2 rounded font-mono text-sm
                    transition-all
                    ${selectedSize === size.id
                      ? 'border-neon-green bg-neon-green/20 text-neon-green'
                      : 'border-neon-green/30 text-gray-400 hover:border-neon-green/60'
                    }
                  `}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-center">
          <p className="text-neon-cyan font-mono">
            SHOWING {filteredCompanies.length} {filteredCompanies.length === 1 ? 'COMPANY' : 'COMPANIES'}
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="
                neon-border rounded-lg p-6
                bg-dark-card/90 backdrop-blur
                hover:bg-dark-hover/50
                transition-all duration-300
                group
              "
            >
              {/* Company Name */}
              <h3 className="text-xl font-bold text-neon-cyan mb-2 font-mono group-hover:text-neon-magenta transition-colors">
                {company.name}
              </h3>

              {/* Description */}
              {company.description && (
                <p className="text-gray-400 text-sm mb-4">{company.description}</p>
              )}

              {/* Tech Stack */}
              {company.tech_stack && company.tech_stack.length > 0 && (
                <div className="mb-4">
                  <p className="text-neon-green text-xs font-mono mb-2">TECH STACK:</p>
                  <div className="flex flex-wrap gap-1">
                    {company.tech_stack.slice(0, 6).map(tech => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-neon-green/10 border border-neon-green/30 rounded text-neon-green text-xs font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                    {company.tech_stack.length > 6 && (
                      <span className="px-2 py-1 text-gray-400 text-xs font-mono">
                        +{company.tech_stack.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Locations */}
              {company.locations && company.locations.length > 0 && (
                <div className="mb-4">
                  <p className="text-neon-magenta text-xs font-mono mb-1">LOCATIONS:</p>
                  <p className="text-gray-400 text-sm">
                    {company.locations.slice(0, 3).join(', ')}
                    {company.locations.length > 3 && ` +${company.locations.length - 3}`}
                  </p>
                </div>
              )}

              {/* Categories */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {company.categories?.slice(0, 4).map(cat => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-neon-cyan text-xs font-mono"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <a
                href={company.career_url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  block w-full py-3
                  border-2 border-neon-cyan rounded
                  text-neon-cyan font-mono text-sm font-bold text-center
                  hover:bg-neon-cyan/10
                  transition-all
                "
              >
                VIEW CAREERS →
              </a>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCompanies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-neon-magenta font-mono">NO COMPANIES FOUND</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
