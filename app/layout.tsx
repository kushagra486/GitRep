import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'GitHub Scraper — AI-Powered Repository Discovery',
  description: 'Scrape, search and analyse GitHub repositories with AI. Find the right tool by intent, not keywords.',
  keywords: ['github', 'scraper', 'open source', 'developer tools', 'semantic search', 'AI'],
  icons: { icon: '/favicon.ico' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0a0e1a] text-slate-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
