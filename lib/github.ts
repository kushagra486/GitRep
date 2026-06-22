import type { GitHubRepo } from '@/types'

const GITHUB_BASE = 'https://api.github.com'

const headers = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28'
})

/**
 * Search GitHub repos by topic/language with quality filters.
 */
export async function fetchReposByTopic(
  topic: string,
  options: { language?: string; per_page?: number; page?: number } = {}
): Promise<GitHubRepo[]> {
  const { language, per_page = 30, page = 1 } = options

  let q = `topic:${topic} stars:>50 is:public fork:false archived:false`
  if (language) q += ` language:${language}`

  const params = new URLSearchParams({
    q,
    sort: 'stars',
    order: 'desc',
    per_page: String(per_page),
    page: String(page)
  })

  const res = await fetch(`${GITHUB_BASE}/search/repositories?${params}`, {
    headers: headers()
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub search error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.items as GitHubRepo[]
}

/**
 * Fetch a single repo's README content (decoded from base64).
 */
export async function fetchReadme(fullName: string): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_BASE}/repos/${fullName}/readme`, {
      headers: headers()
    })
    if (!res.ok) return null

    const data = await res.json()
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8')
    // Strip markdown headers, badges, HTML — keep plain text
    return decoded
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
  } catch {
    return null
  }
}

/**
 * Fetch closed issues count for a repo (used in health score).
 */
export async function fetchClosedIssuesCount(fullName: string): Promise<number> {
  try {
    const res = await fetch(
      `${GITHUB_BASE}/repos/${fullName}/issues?state=closed&per_page=1`,
      { headers: headers() }
    )
    if (!res.ok) return 0

    // GitHub returns total in Link header — parse last page number
    const link = res.headers.get('link') ?? ''
    const match = link.match(/page=(\d+)>; rel="last"/)
    return match ? parseInt(match[1]) : 1
  } catch {
    return 0
  }
}

/**
 * Fetch trending repos (last 7 days, sorted by stars gained).
 */
export async function fetchTrendingRepos(
  language?: string,
  days = 7
): Promise<GitHubRepo[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  let q = `created:>${since} stars:>10 is:public fork:false archived:false`
  if (language) q += ` language:${language}`

  const params = new URLSearchParams({
    q,
    sort: 'stars',
    order: 'desc',
    per_page: '20'
  })

  const res = await fetch(`${GITHUB_BASE}/search/repositories?${params}`, {
    headers: headers()
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.items as GitHubRepo[]
}

/**
 * Fetch the latest release notes for a repo.
 */
export async function fetchLatestRelease(fullName: string): Promise<{
  tag: string
  name: string
  body: string
  published_at: string
} | null> {
  try {
    const res = await fetch(`${GITHUB_BASE}/repos/${fullName}/releases/latest`, {
      headers: headers()
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      tag: data.tag_name,
      name: data.name,
      body: (data.body ?? '').slice(0, 2000),
      published_at: data.published_at
    }
  } catch {
    return null
  }
}

/**
 * Sleep helper to respect GitHub rate limits between batch calls.
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
