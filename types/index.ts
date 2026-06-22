// ─── Repository ──────────────────────────────────────────────────────────────

export interface Repository {
  id: string
  github_id: number
  full_name: string           // e.g. "facebook/react"
  name: string
  owner: string
  description: string | null
  url: string
  homepage: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  open_issues: number
  closed_issues: number
  watchers: number
  last_push: string           // ISO date
  created_at: string
  updated_at: string
  readme_excerpt: string | null
  embedding?: number[]        // 768-dim vector — omitted from most responses
  health_score: number        // 0–100
  health_label: 'healthy' | 'moderate' | 'inactive'
  license: string | null
  is_archived: boolean
  is_fork: boolean
  default_branch: string
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult extends Omit<Repository, 'embedding'> {
  similarity: number          // cosine similarity 0–1
  relevance_score: number     // composite: 0.6*similarity + 0.4*health
}

export interface SearchRequest {
  query: string
  limit?: number              // default 10
  language?: string | null
  min_health?: number         // 0–100
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  total: number
  took_ms: number
}

// ─── Health Score ─────────────────────────────────────────────────────────────

export interface HealthScore {
  total: number               // 0–100
  label: 'healthy' | 'moderate' | 'inactive'
  breakdown: {
    stars_score: number       // 0–30
    activity_score: number    // 0–30  (days since last push)
    issues_score: number      // 0–25  (open/closed ratio)
    community_score: number   // 0–15  (forks, watchers)
  }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  repos?: SearchResult[]      // attached results when assistant surfaces repos
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context_repos?: SearchResult[]   // repos currently in view
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface RepoAnalysis {
  repo_full_name: string
  pros: string[]
  cons: string[]
  best_for: string[]
  avoid_if: string[]
  alternatives: AlternativeSummary[]
  summary: string
}

export interface AlternativeSummary {
  full_name: string
  description: string
  why_alternative: string
  stars: number
  url: string
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export interface FeedItem {
  id: string
  type: 'trending' | 'release' | 'debate'
  repo: Repository
  title: string
  summary: string             // AI-generated TL;DR
  velocity?: number           // stars gained in last 24h
  created_at: string
}

export interface UserPreferences {
  user_id: string
  stacks: string[]            // ['react', 'python', 'rust']
  followed_repos: string[]    // full_names
  updated_at: string
}

// ─── Matchmaker ───────────────────────────────────────────────────────────────

export interface DependencyMatch {
  current_package: string
  current_version: string
  is_outdated: boolean
  is_deprecated: boolean
  alternatives: {
    name: string
    description: string
    stars: number
    url: string
    reason: string
  }[]
}

export interface MatchmakerResponse {
  matches: DependencyMatch[]
  total_deps: number
  outdated_count: number
  deprecated_count: number
}

// ─── GitHub API raw types ─────────────────────────────────────────────────────

export interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string }
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  watchers_count: number
  pushed_at: string
  created_at: string
  updated_at: string
  license: { name: string } | null
  archived: boolean
  fork: boolean
  default_branch: string
}
