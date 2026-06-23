# GitRep — GitHub Scraper 🔍

**AI-powered GitHub repository scraper and discovery engine.**  
Find the right open-source tool by describing what you need — not by guessing keywords.

🌐 **Live app:** [Deploy to Vercel in 5 minutes](#deployment)

---

## What it does

| Feature | Description |
|---|---|
| 🔍 **Semantic Scraping** | Natural language search across 50K+ GitHub repos |
| 💊 **Health Scoring** | Repos ranked by stars velocity, activity & issue health |
| 🤖 **AI Chat (Groq)** | Streaming conversational assistant |
| ✦ **Deep Analysis** | On-demand AI pros/cons/alternatives for any repo |
| 🔄 **Daily Ingestion** | Vercel cron auto-scrapes GitHub every night at 2AM |

## Tech Stack — 100% Free Tier

```
Next.js 14    →  Frontend + API routes
Vercel        →  Deploy + cron jobs
Supabase      →  Postgres + pgvector + auth
OpenRouter    →  Free embeddings (nomic-embed-text-v1.5)
Groq API      →  Ultra-fast LLM inference
GitHub API    →  5,000 req/hr authenticated
Tailwind CSS  →  Styling
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/kushagra486/GitRep.git
cd GitRep
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys |
| `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) (public_repo scope) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) |
| `CRON_SECRET` | Any random string you choose |

### 3. Supabase Schema

1. Go to your Supabase project → **SQL Editor**
2. Paste and run the full contents of `supabase/schema.sql`
3. Verify the `repositories` table and `match_repositories()` function appear

### 4. Seed the Database

```bash
npm run ingest
```

Scrapes ~600 repos from GitHub across 20 topics. Takes ~15 minutes on first run.  
Re-running is safe — skips repos with fresh embeddings (< 7 days old).

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

---

## Deployment

### One-click Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kushagra486/GitRep)

### Manual

```bash
npm install -g vercel
vercel
```

Add all environment variables in **Vercel Dashboard → Settings → Environment Variables**.

The cron job in `vercel.json` auto-runs every night at 2AM UTC — no setup needed.

---

## Project Structure

```
GitRep/
├── app/
│   ├── api/
│   │   ├── search/route.ts       POST /api/search
│   │   ├── chat/route.ts         POST /api/chat  (SSE streaming)
│   │   ├── analyse/route.ts      POST /api/analyse
│   │   └── ingest/route.ts       GET  /api/ingest (Vercel cron)
│   ├── page.tsx                  Main page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── search/SearchBar.tsx
│   ├── search/FilterBar.tsx
│   ├── repo/RepoCard.tsx
│   ├── repo/RepoGrid.tsx
│   ├── repo/RepoAnalysisModal.tsx
│   ├── chat/ChatPanel.tsx
│   └── ui/HeroSection.tsx
├── lib/
│   ├── supabase.ts               Supabase client (browser + admin)
│   ├── health.ts                 Health score algorithm
│   ├── embeddings.ts             OpenRouter embedding calls
│   ├── github.ts                 GitHub REST API fetcher
│   └── groq.ts                   Groq client + system prompts
├── types/index.ts                All TypeScript types
├── scripts/ingest.ts             CLI ingestion script
├── supabase/schema.sql           Full DB schema + pgvector setup
└── vercel.json                   Cron: nightly at 2AM UTC
```

---

## How the Scraper Works

```
Nightly Cron (Vercel)
  └── GitHub API  →  fetch top repos per topic
      └── README  →  trim to 500 tokens
          └── OpenRouter  →  generate 768-dim embedding
              └── Supabase  →  upsert repo + vector + health score

User Search
  └── query string
      └── OpenRouter  →  embed query
          └── Supabase pgvector  →  cosine similarity top-20
              └── Rerank  →  (0.6 × similarity) + (0.4 × health)
                  └── Return top-10 to UI
```

## Health Score

```
health_score (0–100) =
  stars_score    (0–30)  log-scale stars
  activity_score (0–30)  days since last push
  issues_score   (0–25)  open/closed issue ratio
  community_score(0–15)  forks + watchers

healthy ≥ 65  |  moderate 35–64  |  inactive < 35
```

---

## License

MIT — free to use, fork, and deploy.
