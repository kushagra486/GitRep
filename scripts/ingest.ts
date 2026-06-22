/**
 * DevDiscovery — Ingestion Pipeline
 *
 * Run: npm run ingest
 *
 * What this does:
 * 1. Fetches top repos from GitHub for each topic/language combo
 * 2. Fetches README for each repo
 * 3. Generates vector embeddings via OpenRouter
 * 4. Computes health scores
 * 5. Upserts everything to Supabase
 *
 * Safe to re-run — only embeds repos not yet embedded or updated >7 days ago.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { computeHealthScore } from '../lib/health'
import { generateEmbeddingBatch, prepareRepoText } from '../lib/embeddings'
import {
  fetchReposByTopic,
  fetchReadme,
  fetchClosedIssuesCount,
  sleep
} from '../lib/github'
import type { GitHubRepo } from '../types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Topics to ingest ─────────────────────────────────────────────────────────
const TOPICS = [
  'react', 'nextjs', 'typescript', 'python', 'rust',
  'vue', 'svelte', 'nodejs', 'golang', 'machine-learning',
  'tailwindcss', 'prisma', 'drizzle', 'trpc', 'zustand',
  'testing', 'docker', 'kubernetes', 'graphql', 'api'
]

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 DevDiscovery Ingestion Pipeline starting...\n')

  let totalIngested = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const topic of TOPICS) {
    console.log(`\n📦 Topic: ${topic}`)

    let repos: GitHubRepo[] = []
    try {
      repos = await fetchReposByTopic(topic, { per_page: 30 })
      console.log(`   Found ${repos.length} repos`)
    } catch (err) {
      console.error(`   ❌ GitHub fetch error: ${err}`)
      totalErrors++
      await sleep(2000)
      continue
    }

    // Check which repos already have fresh embeddings
    const fullNames = repos.map(r => r.full_name)
    const { data: existing } = await supabase
      .from('repositories')
      .select('full_name, embedded_at')
      .in('full_name', fullNames)

    const existingMap = new Map(
      (existing ?? []).map(r => [r.full_name, r.embedded_at])
    )

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const toProcess = repos.filter(repo => {
      const embeddedAt = existingMap.get(repo.full_name)
      if (!embeddedAt) return true // never embedded
      return new Date(embeddedAt) < sevenDaysAgo // stale
    })

    if (toProcess.length === 0) {
      console.log(`   ✅ All repos already fresh — skipping`)
      totalSkipped += repos.length
      continue
    }

    console.log(`   Processing ${toProcess.length} repos (${repos.length - toProcess.length} already fresh)`)

    // Process in batches of 10 to avoid rate limits
    const BATCH_SIZE = 10
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE)

      // Fetch READMEs and closed issue counts in parallel
      const enriched = await Promise.all(
        batch.map(async repo => {
          const [readme, closedIssues] = await Promise.all([
            fetchReadme(repo.full_name),
            fetchClosedIssuesCount(repo.full_name)
          ])
          return { repo, readme, closedIssues }
        })
      )

      // Generate embeddings for the batch
      const texts = enriched.map(({ repo, readme }) =>
        prepareRepoText(repo.full_name, repo.description, readme)
      )

      let embeddings: number[][]
      try {
        embeddings = await generateEmbeddingBatch(texts)
      } catch (err) {
        console.error(`   ❌ Embedding error for batch ${i}: ${err}`)
        totalErrors += batch.length
        await sleep(3000)
        continue
      }

      // Build upsert rows
      const rows = enriched.map(({ repo, readme, closedIssues }, idx) => {
        const health = computeHealthScore(repo, closedIssues)
        return {
          github_id:      repo.id,
          full_name:      repo.full_name,
          name:           repo.name,
          owner:          repo.owner.login,
          description:    repo.description,
          url:            repo.html_url,
          homepage:       repo.homepage,
          language:       repo.language,
          topics:         repo.topics ?? [],
          stars:          repo.stargazers_count,
          forks:          repo.forks_count,
          open_issues:    repo.open_issues_count,
          closed_issues:  closedIssues,
          watchers:       repo.watchers_count,
          last_push:      repo.pushed_at,
          repo_created_at: repo.created_at,
          repo_updated_at: repo.updated_at,
          readme_excerpt: readme?.slice(0, 1000) ?? null,
          embedding:      `[${embeddings[idx].join(',')}]`,
          health_score:   health.total,
          health_label:   health.label,
          license:        repo.license?.name ?? null,
          is_archived:    repo.archived,
          is_fork:        repo.fork,
          default_branch: repo.default_branch,
          embedded_at:    new Date().toISOString()
        }
      })

      const { error } = await supabase
        .from('repositories')
        .upsert(rows, { onConflict: 'github_id' })

      if (error) {
        console.error(`   ❌ Supabase upsert error: ${error.message}`)
        totalErrors += batch.length
      } else {
        console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} repos upserted`)
        totalIngested += batch.length
      }

      // Rate limit: GitHub allows 5000 req/hr; OpenRouter free tier: be gentle
      await sleep(1000)
    }

    // Pause between topics to be kind to rate limits
    await sleep(2000)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Ingestion complete`)
  console.log(`   Ingested: ${totalIngested}`)
  console.log(`   Skipped:  ${totalSkipped}`)
  console.log(`   Errors:   ${totalErrors}`)
  console.log(`${'─'.repeat(50)}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
