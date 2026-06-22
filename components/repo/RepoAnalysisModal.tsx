'use client'

import { useEffect, useState } from 'react'
import type { RepoAnalysis } from '@/types'

interface Props {
  fullName: string
  onClose: () => void
}

export default function RepoAnalysisModal({ fullName, onClose }: Props) {
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName })
        })
        if (!res.ok) throw new Error('Analysis failed')
        const data = await res.json()
        setAnalysis(data)
      } catch {
        setError('Analysis failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [fullName])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">AI Analysis</div>
            <div className="text-sm font-medium text-white font-mono">{fullName}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex flex-col gap-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <p className="text-slate-500 text-sm">Analysing repository with AI…</p>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center py-8">{error}</div>
          )}

          {analysis && (
            <>
              {/* Summary */}
              <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                {analysis.summary}
              </p>

              {/* Pros/Cons grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <span>✓</span> Pros
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.pros.map((p, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                        <span className="text-emerald-500 shrink-0 mt-0.5">·</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                    <span>✗</span> Cons
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.cons.map((c, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                        <span className="text-red-500 shrink-0 mt-0.5">·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Best for / Avoid if */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-[10px] font-mono uppercase text-slate-500 mb-2">Best for</h4>
                  <ul className="space-y-1">
                    {analysis.best_for.map((b, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                        <span className="text-blue-500">→</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-mono uppercase text-slate-500 mb-2">Avoid if</h4>
                  <ul className="space-y-1">
                    {analysis.avoid_if.map((a, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                        <span className="text-amber-500">⚠</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
