'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, SearchResult } from '@/types'

interface Props {
  messages: ChatMessage[]
  onMessagesChange: (msgs: ChatMessage[]) => void
  contextRepos: SearchResult[]
  onClose: () => void
}

export default function ChatPanel({ messages, onMessagesChange, contextRepos, onClose }: Props) {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMsg]
    onMessagesChange(updatedMessages)
    setInput('')
    setIsStreaming(true)

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    }
    onMessagesChange([...updatedMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context_repos: contextRepos
        })
      })

      if (!res.ok) throw new Error('Chat failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6))
                accumulated += parsed.content ?? ''
                onMessagesChange(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { ...assistantMsg, content: accumulated }
                  return updated
                })
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch {
      onMessagesChange(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...assistantMsg, content: 'Something went wrong. Please try again.' }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="fixed right-0 top-14 bottom-0 w-[360px] bg-[#0d1420] border-l border-slate-800 flex flex-col z-30">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">Scraper AI</span>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Groq</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-slate-500 text-xs text-center mb-3">Ask me to scrape, compare, or analyse</p>
            {[
              'What\'s the best state management for React in 2025?',
              'Compare Prisma vs Drizzle ORM',
              'Find alternatives to lodash',
              'I need a fast HTTP client for Python'
            ].map(s => (
              <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                className="text-left text-xs px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-all">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`fade-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-100'
                : 'bg-slate-800 border border-slate-700 text-slate-200'
              }
            `}>
              {msg.content || (isStreaming ? '…' : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Context indicator */}
      {contextRepos.length > 0 && (
        <div className="px-4 py-1.5 border-t border-slate-800/50">
          <span className="text-[10px] text-slate-600 font-mono">
            📦 {contextRepos.length} repos in context
          </span>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about repos, errors, comparisons…"
            rows={1}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none max-h-28 transition-all"
            style={{ minHeight: '38px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
            {isStreaming ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
