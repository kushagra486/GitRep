'use client'

import SearchBar from '@/components/search/SearchBar'

const EXAMPLE_QUERIES = [
  'lightweight React table with sorting and pagination',
  'fast Python HTTP client with async support',
  'TypeScript ORM with good migration tooling',
  'Rust web framework with performance benchmarks',
  'state management for React without boilerplate',
]

interface Props { onSearch: (query: string) => void }

export default function HeroSection({ onSearch }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center">

        {/* Badge */}
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5">
          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-xs text-blue-400 font-medium font-mono">AI-Powered GitHub Scraper</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center leading-tight mb-4 max-w-3xl tracking-tight">
          <span className="text-white">Scrape GitHub.</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Find what actually works.
          </span>
        </h1>

        <p className="text-slate-400 text-center text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          AI-powered semantic search across thousands of GitHub repositories.
          Results ranked by relevance <em>and</em> repo health — not just star count.
        </p>

        {/* Search */}
        <div className="w-full max-w-2xl mb-8">
          <SearchBar onSearch={onSearch} isLoading={false} autoFocus />
        </div>

        {/* Example queries */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-600 mb-1">Try scraping for</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => onSearch(q)}
                className="px-3 py-1.5 rounded-full text-xs text-slate-400 border border-slate-800 bg-slate-900/50 hover:border-blue-500/30 hover:text-slate-200 transition-all duration-150"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-14 text-center">
          {[
            { value: '50K+', label: 'Repos scraped', color: 'text-blue-400' },
            { value: '768d', label: 'Vector embeddings', color: 'text-cyan-400' },
            { value: '$0',   label: 'Free forever',      color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label}>
              <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
