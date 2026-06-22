import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'
import type { SearchRequest, SearchResponse } from '@/types'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const start = Date.now()

  try {
    const body: SearchRequest = await req.json()
    const { query, limit = 10, language = null, min_health = 0 } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // 1. Convert query to vector embedding
    const embedding = await generateEmbedding(query.trim())

    // 2. Run pgvector cosine similarity search with health reranking
    const { data, error } = await supabaseAdmin.rpc('match_repositories', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: limit,
      filter_language: language,
      min_health_score: min_health
    })

    if (error) {
      console.error('Supabase search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const response: SearchResponse = {
      results: data ?? [],
      query,
      total: (data ?? []).length,
      took_ms: Date.now() - start
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
