-- ============================================================
-- DevDiscovery — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- Project: https://supabase.com/dashboard
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- ============================================================
-- 2. REPOSITORIES TABLE
-- Core store for all GitHub repo data + embeddings
-- ============================================================

create table if not exists repositories (
  id              uuid primary key default gen_random_uuid(),
  github_id       bigint unique not null,
  full_name       text unique not null,     -- "facebook/react"
  name            text not null,
  owner           text not null,
  description     text,
  url             text not null,
  homepage        text,
  language        text,
  topics          text[] default '{}',
  stars           integer default 0,
  forks           integer default 0,
  open_issues     integer default 0,
  closed_issues   integer default 0,
  watchers        integer default 0,
  last_push       timestamptz,
  repo_created_at timestamptz,
  repo_updated_at timestamptz,
  readme_excerpt  text,
  embedding       vector(768),              -- nomic-embed-text-v1.5 dimensions
  health_score    smallint default 0,       -- 0–100
  health_label    text default 'inactive',  -- 'healthy' | 'moderate' | 'inactive'
  license         text,
  is_archived     boolean default false,
  is_fork         boolean default false,
  default_branch  text default 'main',
  embedded_at     timestamptz,              -- last time embedding was generated
  ingested_at     timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Index for vector similarity search (HNSW — fast approximate nearest neighbour)
create index if not exists repositories_embedding_idx
  on repositories
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Index for common filters
create index if not exists repositories_language_idx on repositories(language);
create index if not exists repositories_health_score_idx on repositories(health_score desc);
create index if not exists repositories_stars_idx on repositories(stars desc);
create index if not exists repositories_last_push_idx on repositories(last_push desc);

-- ============================================================
-- 3. SEMANTIC SEARCH FUNCTION
-- Returns repos ranked by cosine similarity + health score
-- ============================================================

create or replace function match_repositories(
  query_embedding   vector(768),
  match_count       int     default 10,
  filter_language   text    default null,
  min_health_score  int     default 0
)
returns table (
  id              uuid,
  github_id       bigint,
  full_name       text,
  name            text,
  owner           text,
  description     text,
  url             text,
  homepage        text,
  language        text,
  topics          text[],
  stars           integer,
  forks           integer,
  open_issues     integer,
  closed_issues   integer,
  watchers        integer,
  last_push       timestamptz,
  readme_excerpt  text,
  health_score    smallint,
  health_label    text,
  license         text,
  is_archived     boolean,
  is_fork         boolean,
  similarity      float,
  relevance_score float
)
language plpgsql
as $$
begin
  return query
  select
    r.id,
    r.github_id,
    r.full_name,
    r.name,
    r.owner,
    r.description,
    r.url,
    r.homepage,
    r.language,
    r.topics,
    r.stars,
    r.forks,
    r.open_issues,
    r.closed_issues,
    r.watchers,
    r.last_push,
    r.readme_excerpt,
    r.health_score,
    r.health_label,
    r.license,
    r.is_archived,
    r.is_fork,
    -- cosine similarity (1 - distance)
    (1 - (r.embedding <=> query_embedding))::float as similarity,
    -- composite relevance: 60% semantic + 40% health
    ((1 - (r.embedding <=> query_embedding)) * 0.6 + (r.health_score::float / 100) * 0.4)::float as relevance_score
  from repositories r
  where
    r.embedding is not null
    and r.is_archived = false
    and r.health_score >= min_health_score
    and (filter_language is null or lower(r.language) = lower(filter_language))
  order by relevance_score desc
  limit match_count;
end;
$$;

-- ============================================================
-- 4. USER PREFERENCES TABLE
-- Stores stack selections and followed repos (Phase 4)
-- ============================================================

create table if not exists user_preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  stacks        text[] default '{}',       -- ['react', 'python', 'rust']
  followed_repos text[] default '{}',      -- full_names
  updated_at    timestamptz default now(),
  unique(user_id)
);

-- ============================================================
-- 5. FEED ITEMS TABLE
-- AI-generated daily feed entries (Phase 4)
-- ============================================================

create table if not exists feed_items (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,             -- 'trending' | 'release' | 'debate'
  repo_id       uuid references repositories(id) on delete cascade,
  title         text not null,
  summary       text not null,             -- AI TL;DR
  velocity      integer,                   -- stars gained in 24h
  created_at    timestamptz default now()
);

create index if not exists feed_items_created_at_idx on feed_items(created_at desc);
create index if not exists feed_items_type_idx on feed_items(type);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table repositories enable row level security;
alter table user_preferences enable row level security;
alter table feed_items enable row level security;

-- Repos are public read
create policy "Repos are publicly readable"
  on repositories for select using (true);

-- User prefs: users can only read/write their own
create policy "Users can read own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);

-- Feed is public read
create policy "Feed is publicly readable"
  on feed_items for select using (true);

-- ============================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger repositories_updated_at
  before update on repositories
  for each row execute function update_updated_at();

-- ============================================================
-- DONE. 
-- Next step: run the ingestion script to populate repositories.
-- See: scripts/ingest.ts
-- ============================================================
