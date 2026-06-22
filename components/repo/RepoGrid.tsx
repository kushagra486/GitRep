'use client'

import RepoCard from './RepoCard'
import type { SearchResult } from '@/types'

interface Props {
  results: SearchResult[]
  isLoading: boolean
  query: string
}

function SkeletonCard() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between gap-2">
        <div className="shimmer h-4 w-40 rounded" />
        <div className="shimmer h-4 w-10 rounded-full" />
      </div>
      <div className="shimmer h-3 w-full rounded" />
      <div className="shimmer h-3 w-3/4 rounded" />
      <div className="flex gap-1">
        <div className="shimmer h-4 w-14 rounded" />
        <div className="shimmer h-4 w-18 rounded" />
        <div className="shimmer h-4 w-12 rounded" />
      </div>
      <div className="shimmer h-2 w-full rounded-full mt-1" />
    </div>
  )
}

export default function RepoGrid({ results, isLoading, query }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {results.map((result, i) => (
        <div key={result.id} className="fade-in" style={{ animationDelay: `${i * 40}ms` }}>
          <RepoCard result={result} />
        </div>
      ))}
    </div>
  )
}
