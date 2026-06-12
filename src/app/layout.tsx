import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HRReply.in — AI reply assistant for Indian recruiters',
  description:
    'Generate perfect HR messages in seconds. Formal English, friendly English, or Hinglish — built for Indian recruiters.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-surface-page text-ink font-sans">
        {children}
      </body>
    </html>
  )
}
