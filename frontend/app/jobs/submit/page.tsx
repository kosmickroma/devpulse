'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function SubmitCompanyPage() {
  const [formData, setFormData] = useState({
    name: '',
    career_url: '',
    size: 'startup' as 'large' | 'medium' | 'startup',
    description: '',
    tech_stack: '',
    locations: '',
    categories: [] as string[],
  })

  const categoryOptions = [
    'FAANG',
    'big-tech',
    'startup',
    'remote-friendly',
    'visa-sponsor',
    'intern-program',
    'new-grad',
    'fintech',
    'ai',
    'gaming',
    'developer-tools',
    'saas',
  ]

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const generateGitHubIssue = () => {
    const techStackArray = formData.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
    const locationsArray = formData.locations.split(',').map(s => s.trim()).filter(Boolean)

    const issueBody = `## Company Information

**Company Name:** ${formData.name}
**Career URL:** ${formData.career_url}
**Size:** ${formData.size}
**Description:** ${formData.description}

**Tech Stack:**
${techStackArray.map(tech => `- ${tech}`).join('\n')}

**Locations:**
${locationsArray.map(loc => `- ${loc}`).join('\n')}

**Categories:**
${formData.categories.map(cat => `- ${cat}`).join('\n')}

## JSON Format
\`\`\`json
{
  "id": "${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "name": "${formData.name}",
  "career_url": "${formData.career_url}",
  "size": "${formData.size}",
  "categories": ${JSON.stringify(formData.categories)},
  "tech_stack": ${JSON.stringify(techStackArray)},
  "locations": ${JSON.stringify(locationsArray)},
  "description": "${formData.description}"
}
\`\`\`

---
Submitted via DevPulse Jobs Directory
`

    const title = `[Job Submission] ${formData.name}`
    const repoUrl = 'https://github.com/KosmicKroma/devpulse'
    const issueUrl = `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody)}&labels=job-submission`

    window.open(issueUrl, '_blank')
  }

  const isFormValid = formData.name && formData.career_url && formData.description

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-2 border-neon-cyan/30 py-12">
        <div className="absolute inset-0 perspective-grid opacity-20" style={{ height: '200px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-neon-cyan neon-text-cyan mb-4 font-mono">
            SUBMIT A COMPANY
          </h1>
          <p className="text-xl text-neon-green neon-text-green font-mono">
            &gt; HELP GROW THE DIRECTORY
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="neon-border rounded-lg p-8 bg-dark-card/90 backdrop-blur">
          <p className="text-gray-400 mb-8 font-mono text-sm">
            Submit a tech company to be added to the DevPulse jobs directory.
            This will create a GitHub issue for review.
          </p>

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-neon-cyan font-mono text-sm mb-2">
                COMPANY NAME *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Vercel"
                className="
                  w-full px-4 py-3
                  bg-dark-hover border-2 border-neon-cyan/30 rounded
                  text-gray-200 font-mono
                  focus:border-neon-cyan focus:outline-none
                  transition-colors
                "
              />
            </div>

            {/* Career URL */}
            <div>
              <label className="block text-neon-cyan font-mono text-sm mb-2">
                CAREER PAGE URL *
              </label>
              <input
                type="url"
                value={formData.career_url}
                onChange={(e) => setFormData({ ...formData, career_url: e.target.value })}
                placeholder="https://careers.company.com"
                className="
                  w-full px-4 py-3
                  bg-dark-hover border-2 border-neon-cyan/30 rounded
                  text-gray-200 font-mono
                  focus:border-neon-cyan focus:outline-none
                  transition-colors
                "
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-neon-cyan font-mono text-sm mb-2">
                DESCRIPTION *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what the company does..."
                rows={3}
                className="
                  w-full px-4 py-3
                  bg-dark-hover border-2 border-neon-cyan/30 rounded
                  text-gray-200 font-mono text-sm
                  focus:border-neon-cyan focus:outline-none
                  transition-colors
                "
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-neon-magenta font-mono text-sm mb-2">
                COMPANY SIZE
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'startup', label: 'Startup (<100)' },
                  { value: 'medium', label: 'Medium (100-1000)' },
                  { value: 'large', label: 'Large (1000+)' },
                ].map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="size"
                      value={option.value}
                      checked={formData.size === option.value}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value as any })}
                      className="accent-neon-magenta"
                    />
                    <span className="text-gray-400 font-mono text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-neon-green font-mono text-sm mb-2">
                TECH STACK
              </label>
              <input
                type="text"
                value={formData.tech_stack}
                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                placeholder="JavaScript, Python, Go, TypeScript (comma-separated)"
                className="
                  w-full px-4 py-3
                  bg-dark-hover border-2 border-neon-green/30 rounded
                  text-gray-200 font-mono text-sm
                  focus:border-neon-green focus:outline-none
                  transition-colors
                "
              />
            </div>

            {/* Locations */}
            <div>
              <label className="block text-neon-green font-mono text-sm mb-2">
                LOCATIONS
              </label>
              <input
                type="text"
                value={formData.locations}
                onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                placeholder="San Francisco, Remote, NYC (comma-separated)"
                className="
                  w-full px-4 py-3
                  bg-dark-hover border-2 border-neon-green/30 rounded
                  text-gray-200 font-mono text-sm
                  focus:border-neon-green focus:outline-none
                  transition-colors
                "
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-neon-magenta font-mono text-sm mb-2">
                CATEGORIES
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`
                      px-3 py-2 border-2 rounded font-mono text-xs
                      transition-all
                      ${formData.categories.includes(category)
                        ? 'border-neon-magenta bg-neon-magenta/20 text-neon-magenta'
                        : 'border-neon-magenta/30 text-gray-400 hover:border-neon-magenta/60'
                      }
                    `}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={generateGitHubIssue}
                disabled={!isFormValid}
                className={`
                  w-full py-4
                  border-2 rounded
                  font-mono text-sm font-bold
                  transition-all
                  ${isFormValid
                    ? 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 cursor-pointer'
                    : 'border-gray-600 text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                {isFormValid ? 'CREATE GITHUB ISSUE →' : 'FILL REQUIRED FIELDS'}
              </button>
              <p className="text-gray-400 text-xs font-mono mt-2 text-center">
                This will open GitHub in a new tab with a pre-filled issue for review
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 border-2 border-neon-green/30 rounded-lg bg-neon-green/5">
          <h3 className="text-neon-green font-mono font-bold mb-2">HOW IT WORKS</h3>
          <ul className="text-gray-400 text-sm font-mono space-y-1">
            <li>• Fill out the form with company details</li>
            <li>• Click submit to create a GitHub issue</li>
            <li>• DevPulse maintainers will review your submission</li>
            <li>• Approved companies are added to the directory</li>
          </ul>
        </div>
      </div>

      <Footer />
    </main>
  )
}
