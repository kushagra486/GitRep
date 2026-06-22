import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeHealthScore } from '@/lib/health'
import { generateEmbeddingBatch, prepareRepoText } from '@/lib/embeddings'
import { fetchReposByTopic, fetchReadme, fetchClosedIssuesCount, sleep } from '@/lib/github'

// This route is called by Vercel Cron — verify the secret header
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const TOPICS = ['react', 'nextjs', 'typescript', 'python', 'rust', 'vue', 'nodejs', 'golang']
  let ingested = 0

  for (const topic of TOPICS) {
    try {
      const repos = await fetchReposByTopic(topic, { per_page: 20 })
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const fullNames = repos.map(r => r.full_name)
      const { data: existing } = await supabaseAdmin
        .from('repositories')
        .select('full_name, embedded_at')
        .in('full_name', fullNames)

      const existingMap = new Map((existing ?? []).map(r => [r.full_name, r.embedded_at]))
      const toProcess = repos.filter(repo => {
        const embeddedAt = existingMap.get(repo.full_name)
        return !embeddedAt || new Date(embeddedAt) < sevenDaysAgo
      })

      if (toProcess.length === 0) continue

      for (let i = 0; i < toProcess.length; i += 5) {
        const batch = toProcess.slice(i, i + 5)
        const enriched = await Promise.all(
          batch.map(async repo => ({
            repo,
            readme: await fetchReadme(repo.full_name),
            closedIssues: await fetchClosedIssuesCount(repo.full_name)
          }))
        )

        const texts = enriched.map(({ repo, readme }) =>
          prepareRepoText(repo.full_name, repo.description, readme)
        )

        const embeddings = await generateEmbeddingBatch(texts)

        const rows = enriched.map(({ repo, readme, closedIssues }, idx) => {
          const health = computeHealthScore(repo, closedIssues)
          return {
            github_id: repo.id,
            full_name: repo.full_name,
            name: repo.name,
            owner: repo.owner.login,
            description: repo.description,
            url: repo.html_url,
            homepage: repo.homepage,
            language: repo.language,
            topics: repo.topics ?? [],
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            open_issues: repo.open_issues_count,
            closed_issues: closedIssues,
            watchers: repo.watchers_count,
            last_push: repo.pushed_at,
            repo_created_at: repo.created_at,
            repo_updated_at: repo.updated_at,
            readme_excerpt: readme?.slice(0, 1000) ?? null,
            embedding: `[${embeddings[idx].join(',')}]`,
            health_score: health.total,
            health_label: health.label,
            license: repo.license?.name ?? null,
            is_archived: repo.archived,
            is_fork: repo.fork,
            default_branch: repo.default_branch,
            embedded_at: new Date().toISOString()
          }
        })

        await supabaseAdmin.from('repositories').upsert(rows, { onConflict: 'github_id' })
        ingested += batch.length
        await sleep(500)
      }

      await sleep(1500)
    } catch (err) {
      console.error(`Cron ingest error for topic ${topic}:`, err)
    }
  }

  return NextResponse.json({ ingested, timestamp: new Date().toISOString() })
}
