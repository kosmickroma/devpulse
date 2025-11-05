import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tech Jobs Directory | DevPulse - 100+ Companies Hiring Developers',
  description: 'Browse 100+ tech companies hiring developers. Filter by remote-friendly, visa sponsors, startups, FAANG, and more. Find your next developer job with DevPulse.',
  keywords: [
    'developer jobs',
    'tech jobs',
    'software engineer jobs',
    'remote developer jobs',
    'visa sponsor tech jobs',
    'startup jobs',
    'FAANG jobs',
    'github jobs',
    'tech companies hiring',
    'new grad jobs',
    'internship programs',
    'engineering jobs',
    'programming jobs',
  ],
  openGraph: {
    title: 'Tech Jobs Directory | 100+ Companies Hiring',
    description: 'Find developer jobs at top tech companies. Remote-friendly, visa sponsors, startups, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Jobs Directory | DevPulse',
    description: '100+ tech companies hiring developers. Remote, visa sponsors, startups, FAANG.',
  },
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
