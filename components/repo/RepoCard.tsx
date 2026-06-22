'use client'

import { useState } from 'react'
import { healthColor } from '@/lib/health'
import RepoAnalysisModal from './RepoAnalysisModal'
import type { SearchResult } from '@/types'

interface Props {
  result: SearchResult
}

export default function RepoCard({ result }: Props) {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const health = healthColor(result.health_label)

  const formatStars = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  const daysSince = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  return (
    <>
      <div className="group relative bg-[#111827] border border-slate-800 rounded-xl p-4 card-hover flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 group/link"
            >
              <span className="text-slate-400 text-sm">{result.owner}/</span>
              <span className="text-white font-medium text-sm group-hover/link:text-blue-400 transition-colors">
                {result.name}
              </span>
              <svg className="w-3 h-3 text-slate-600 group-hover/link:text-blue-400 transition-colors shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Health badge */}
          <div className={`
            flex items-center gap-1.5 px-2 py-0.5 rounded-full border shrink-0
            ${health.bg} ${health.border}
          `}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: health.dot }} />
            <span className={`text-[10px] font-mono font-medium ${health.text}`}>
              {result.health_score}
            </span>
          </div>
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {result.description}
          </p>
        )}

        {/* Topics */}
        {result.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.topics.slice(0, 4).map(topic => (
              <span key={topic}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-500 border border-slate-700">
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-800">
          {/* Language */}
          {result.language && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400/60" />
              {result.language}
            </span>
          )}

          {/* Stars */}
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {formatStars(result.stars)}
          </span>

          {/* Forks */}
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            {formatStars(result.forks)}
          </span>

          {/* Last push */}
          {result.last_push && (
            <span className="ml-auto">{daysSince(result.last_push)}</span>
          )}
        </div>

        {/* Relevance indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 h-0.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
              style={{ width: `${Math.round(result.relevance_score * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-600 font-mono shrink-0">
            {Math.round(result.relevance_score * 100)}% match
          </span>
        </div>

        {/* Analyse button */}
        <button
          onClick={() => setShowAnalysis(true)}
          className="
            w-full py-1.5 rounded-lg border border-slate-800 bg-slate-900/50
            text-xs text-slate-400
            hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5
            transition-all duration-150
            opacity-0 group-hover:opacity-100
          "
        >
          ✦ Analyse this repo
        </button>
      </div>

      {/* Analysis modal */}
      {showAnalysis && (
        <RepoAnalysisModal
          fullName={result.full_name}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </>
  )
}
