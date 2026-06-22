/**
 * Generate vector embeddings via OpenRouter's free embedding model.
 * Uses nomic-embed-text which produces 768-dim vectors.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const EMBEDDING_MODEL = 'nomic-ai/nomic-embed-text-v1.5'

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'DevDiscovery'
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter embedding error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'DevDiscovery'
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter batch embedding error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding)
}

/**
 * Prepare text for embedding.
 * Concatenates: repo name + description + README excerpt (first 500 tokens ≈ 2000 chars)
 */
export function prepareRepoText(
  name: string,
  description: string | null,
  readmeExcerpt: string | null
): string {
  const parts = [
    `Repository: ${name}`,
    description ? `Description: ${description}` : '',
    readmeExcerpt ? `README: ${readmeExcerpt.slice(0, 2000)}` : ''
  ].filter(Boolean)

  return parts.join('\n\n')
}
