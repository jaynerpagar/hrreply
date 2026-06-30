import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HRReply.in — AI reply assistant for Indian recruiters',
  description:
    'Generate perfect HR messages in seconds. Formal English, friendly English, or Hinglish — built for Indian recruiters and placement consultants.',
  metadataBase: new URL('https://www.hrreply.in'),
  openGraph: {
    title: 'HRReply.in — AI reply assistant for Indian recruiters',
    description: 'Generate perfect HR messages in seconds. Formal, friendly, or Hinglish — built for Indian recruiters.',
    url: 'https://www.hrreply.in',
    siteName: 'HRReply.in',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HRReply.in — AI reply assistant for Indian recruiters',
    description: 'Generate perfect HR messages in seconds. Built for Indian recruiters.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="antialiased min-h-screen bg-surface-page text-ink font-sans">
        {children}
      </body>
    </html>
  )
}
