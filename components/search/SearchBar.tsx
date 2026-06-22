'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  onSearch: (query: string) => void
  isLoading: boolean
  initialValue?: string
  compact?: boolean
  autoFocus?: boolean
}

export default function SearchBar({
  onSearch,
  isLoading,
  initialValue = '',
  compact = false,
  autoFocus = false
}: Props) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isLoading) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className={`
        relative flex items-center rounded-xl border
        bg-slate-900 border-slate-700
        focus-within:border-blue-500/50 focus-within:bg-slate-900
        transition-all duration-150
        ${compact ? 'h-9' : 'h-12'}
      `}>
        {/* Search icon */}
        <div className={`flex items-center justify-center shrink-0 ${compact ? 'pl-3' : 'pl-4'}`}>
          {isLoading ? (
            <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={compact ? 'Search repositories…' : 'Describe what you need — e.g. "fast TypeScript ORM with migrations"'}
          className={`
            flex-1 bg-transparent text-slate-100 placeholder-slate-600
            focus:outline-none
            ${compact ? 'px-3 text-sm' : 'px-4 text-sm sm:text-base'}
          `}
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); inputRef.current?.focus() }}
            className="shrink-0 p-1.5 mr-1 rounded-md text-slate-600 hover:text-slate-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={`
            shrink-0 rounded-lg font-medium text-xs
            bg-blue-500 text-white
            hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
            ${compact ? 'px-3 py-1.5 mr-1.5' : 'px-4 py-2 mr-1.5'}
          `}
        >
          Search
        </button>
      </div>
    </form>
  )
}
