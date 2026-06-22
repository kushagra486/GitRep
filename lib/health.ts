import type { GitHubRepo, HealthScore } from '@/types'

/**
 * Compute a 0–100 health score from raw GitHub repo data.
 *
 * Breakdown:
 *   stars_score    0–30  logarithmic — rewards popular repos without pure star bias
 *   activity_score 0–30  days since last push (0d=30, 30d=24, 90d=15, 365d=5, >365d=0)
 *   issues_score   0–25  open/closed ratio — low ratio = healthy maintenance
 *   community_score 0–15 forks + watchers signal
 */
export function computeHealthScore(repo: GitHubRepo, closedIssues = 0): HealthScore {
  // Stars score (log scale, max 30)
  const stars = repo.stargazers_count
  const starsScore = Math.min(30, Math.round((Math.log10(stars + 1) / Math.log10(100000)) * 30))

  // Activity score (days since last push, max 30)
  const daysSincePush = Math.floor(
    (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  let activityScore: number
  if (daysSincePush <= 7)        activityScore = 30
  else if (daysSincePush <= 30)  activityScore = 24
  else if (daysSincePush <= 90)  activityScore = 18
  else if (daysSincePush <= 180) activityScore = 12
  else if (daysSincePush <= 365) activityScore = 6
  else                           activityScore = 0

  // Issues score (open/closed ratio, max 25)
  const openIssues = repo.open_issues_count
  let issuesScore: number
  if (closedIssues === 0 && openIssues === 0) {
    issuesScore = 15 // no issues at all — neutral
  } else {
    const ratio = openIssues / Math.max(closedIssues + openIssues, 1)
    // ratio close to 0 = healthy, close to 1 = backlogged
    issuesScore = Math.round((1 - ratio) * 25)
  }

  // Community score (forks + watchers, max 15)
  const communityScore = Math.min(
    15,
    Math.round((Math.log10(repo.forks_count + repo.watchers_count + 1) / Math.log10(50000)) * 15)
  )

  const total = starsScore + activityScore + issuesScore + communityScore

  return {
    total,
    label: total >= 65 ? 'healthy' : total >= 35 ? 'moderate' : 'inactive',
    breakdown: {
      stars_score: starsScore,
      activity_score: activityScore,
      issues_score: issuesScore,
      community_score: communityScore
    }
  }
}

export function healthColor(label: 'healthy' | 'moderate' | 'inactive') {
  return {
    healthy:  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '#10b981' },
    moderate: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: '#f59e0b' },
    inactive: { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30',     dot: '#ef4444' }
  }[label]
}
