'use client'

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Ruby', 'Swift']

interface Props {
  language: string | null
  onLanguageChange: (lang: string | null) => void
  minHealth: number
  onMinHealthChange: (score: number) => void
  onApply: () => void
}

export default function FilterBar({ language, onLanguageChange, minHealth, onMinHealthChange, onApply }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Language filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-500 font-mono">lang:</span>
        <button
          onClick={() => { onLanguageChange(null); onApply() }}
          className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
            !language
              ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          All
        </button>
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => { onLanguageChange(lang); onApply() }}
            className={`px-2.5 py-1 rounded-md text-xs border transition-all font-mono ${
              language === lang
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-800 mx-1" />

      {/* Health filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-mono">health:</span>
        {[
          { label: 'Any', value: 0 },
          { label: '65+', value: 65 },
          { label: '80+', value: 80 }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => { onMinHealthChange(opt.value); onApply() }}
            className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
              minHealth === opt.value
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
