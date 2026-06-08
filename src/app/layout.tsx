import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HRReply.ai — AI Reply Assistant for Indian Recruiters',
  description:
    'Generate perfect HR replies in seconds. Formal English, Friendly English, or Hinglish — built for Indian recruiters.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0a0c10] text-gray-100">{children}</body>
    </html>
  )
}
