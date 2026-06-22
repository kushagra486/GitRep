import { NextRequest, NextResponse } from 'next/server'
import { groq, FAST_MODEL, ANALYSIS_SYSTEM_PROMPT } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchReadme, fetchLatestRelease } from '@/lib/github'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { full_name } = await req.json()

    if (!full_name) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }

    // Fetch repo from Supabase
    const { data: repo, error } = await supabaseAdmin
      .from('repositories')
      .select('*')
      .eq('full_name', full_name)
      .single()

    if (error || !repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 })
    }

    // Fetch fresh README and latest release for richer analysis
    const [readme, release] = await Promise.all([
      fetchReadme(full_name),
      fetchLatestRelease(full_name)
    ])

    const prompt = `Analyze this GitHub repository:

Repository: ${repo.full_name}
Description: ${repo.description ?? 'None'}
Language: ${repo.language ?? 'Unknown'}
Stars: ${repo.stars.toLocaleString()}
Forks: ${repo.forks.toLocaleString()}
Open Issues: ${repo.open_issues}
Last Push: ${repo.last_push}
Topics: ${(repo.topics ?? []).join(', ') || 'None'}
Health Score: ${repo.health_score}/100 (${repo.health_label})
License: ${repo.license ?? 'Unknown'}

${readme ? `README (excerpt):\n${readme.slice(0, 1500)}` : ''}
${release ? `\nLatest Release (${release.tag}):\n${release.body.slice(0, 500)}` : ''}`

    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.3
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'

    let analysis
    try {
      analysis = JSON.parse(raw)
    } catch {
      // If JSON parse fails, return a structured error
      return NextResponse.json({ error: 'Analysis parsing failed', raw }, { status: 500 })
    }

    return NextResponse.json({
      repo_full_name: full_name,
      ...analysis
    })
  } catch (err) {
    console.error('Analyse API error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
