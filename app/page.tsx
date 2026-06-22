'use client'

import { useState, useCallback } from 'react'
import SearchBar from '@/components/search/SearchBar'
import RepoGrid from '@/components/repo/RepoGrid'
import ChatPanel from '@/components/chat/ChatPanel'
import FilterBar from '@/components/search/FilterBar'
import HeroSection from '@/components/ui/HeroSection'
import type { SearchResult, ChatMessage } from '@/types'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [took, setTook] = useState<number | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const [minHealth, setMinHealth] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setError(null)
    setHasSearched(true)
    setQuery(searchQuery)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 12, language, min_health: minHealth })
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.results)
      setTook(data.took_ms)
    } catch {
      setError('Search failed. Please check your connection and try again.')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [language, minHealth])

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-[#0a0e1a]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">GitHub Scraper</div>
              <div className="text-[9px] text-slate-500 leading-none mt-0.5 font-mono">AI Repository Discovery</div>
            </div>
          </a>

          {/* Inline search when results are showing */}
          {hasSearched && (
            <div className="flex-1 max-w-2xl">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} initialValue={query} compact />
            </div>
          )}

          {/* AI Chat toggle */}
          <button
            onClick={() => setChatOpen(v => !v)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
              border transition-all duration-150 shrink-0
              ${chatOpen
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Chat
          </button>
        </div>
      </header>

      <main className="flex-1 flex">
        <div className={`flex-1 flex flex-col transition-all duration-300 ${chatOpen ? 'mr-[360px]' : ''}`}>
          {!hasSearched ? (
            <HeroSection onSearch={handleSearch} />
          ) : (
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
              <FilterBar
                language={language}
                onLanguageChange={setLanguage}
                minHealth={minHealth}
                onMinHealthChange={setMinHealth}
                onApply={() => handleSearch(query)}
              />

              {!isSearching && results.length > 0 && (
                <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                  <span>{results.length} repositories scraped for</span>
                  <span className="text-slate-300 font-medium">"{query}"</span>
                  {took && <span>· {took}ms</span>}
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <RepoGrid results={results} isLoading={isSearching} query={query} />

              {!isSearching && results.length === 0 && hasSearched && !error && (
                <div className="text-center py-20">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-slate-300 font-medium mb-1">No repositories found</h3>
                  <p className="text-slate-500 text-sm">Try a different query or remove filters</p>
                </div>
              )}
            </div>
          )}
        </div>

        {chatOpen && (
          <ChatPanel
            messages={chatMessages}
            onMessagesChange={setChatMessages}
            contextRepos={results}
            onClose={() => setChatOpen(false)}
          />
        )}
      </main>
    </div>
  )
}
