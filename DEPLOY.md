# Deploy GitRep in 15 Minutes

## Step 1 — Create the GitHub repo

Run this in your terminal (replace YOUR_GITHUB_TOKEN and YOUR_USERNAME):

```bash
curl -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"GitRep","description":"AI-powered GitHub scraper and repository discovery engine","private":false,"auto_init":false}'
```

## Step 2 — Push this code

```bash
cd GitRep
git init
git add .
git commit -m "feat: initial GitRep — AI-powered GitHub scraper"
git branch -M main
git remote add origin https://github.com/kushagra486/GitRep.git
git push -u origin main
```

## Step 3 — Supabase setup

1. Go to https://supabase.com → New project
2. SQL Editor → paste entire contents of `supabase/schema.sql` → Run
3. Settings → API → copy Project URL, anon key, service_role key

## Step 4 — Get your API keys

| Key | URL |
|-----|-----|
| GitHub Token | https://github.com/settings/tokens/new → check `public_repo` |
| Groq API Key | https://console.groq.com → API Keys → Create |
| OpenRouter Key | https://openrouter.ai → Keys → Create |

## Step 5 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add these environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GITHUB_TOKEN
- GROQ_API_KEY
- OPENROUTER_API_KEY
- NEXT_PUBLIC_APP_URL  (your vercel URL e.g. https://gitrep.vercel.app)
- CRON_SECRET  (any random string)

Or add them in: https://vercel.com/dashboard → your project → Settings → Environment Variables

## Step 6 — Seed the database

```bash
cp .env.local.example .env.local
# fill in .env.local with your keys
npm run ingest
```

Takes ~15 mins. Run once. After that, the nightly Vercel cron handles updates.

## Done 🚀

Your app is live at https://YOUR_PROJECT.vercel.app
