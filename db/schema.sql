-- Life OS schema. Run on a Supabase project (Postgres 15+).
-- Idempotent: safe to re-run.

create extension if not exists "uuid-ossp";
create extension if not exists vector;
create extension if not exists pg_trgm;

-- =====================================================================
-- Core entities
-- =====================================================================

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active','paused','done','archived')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_idx on goals (user_id, status);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'todo' check (status in ('todo','doing','blocked','done','cancelled')),
  priority int not null default 3 check (priority between 1 and 5),
  estimate_minutes int,
  due_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_status_idx on tasks (user_id, status);
create index if not exists tasks_goal_idx on tasks (goal_id);
create index if not exists tasks_scheduled_idx on tasks (user_id, scheduled_start);

-- Dependency edges: child depends on parent (parent must finish first).
create table if not exists task_deps (
  parent_id uuid not null references tasks(id) on delete cascade,
  child_id  uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (parent_id, child_id),
  check (parent_id <> child_id)
);
create index if not exists task_deps_child_idx on task_deps (child_id);
create index if not exists task_deps_user_idx on task_deps (user_id);

create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cadence text not null default 'daily' check (cadence in ('daily','weekly','custom')),
  target_per_period int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists habits_user_idx on habits (user_id, active);

create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  logged_at timestamptz not null default now(),
  value numeric,
  note text
);
create index if not exists habit_logs_habit_idx on habit_logs (habit_id, logged_at desc);

create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  mood int check (mood between 1 and 10),
  tags text[] not null default '{}',
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists journal_user_date_idx on journal_entries (user_id, entry_date desc);

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source text not null default 'manual',
  external_id text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists events_user_time_idx on events (user_id, starts_at);

-- =====================================================================
-- Semantic memory (RAG)
-- =====================================================================

create table if not exists memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  content text not null,
  embedding vector(1024),
  tsv tsvector generated always as (to_tsvector('english', coalesce(content,''))) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists memories_user_idx on memories (user_id);
create index if not exists memories_tsv_idx on memories using gin (tsv);
create index if not exists memories_embedding_idx on memories
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Hybrid retrieval: combines vector cosine + full-text rank.
create or replace function match_memories(
  p_user uuid,
  p_query text,
  p_embedding vector(1024),
  p_limit int default 8
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  content text,
  metadata jsonb,
  score real
)
language sql stable as $$
  with q as (select websearch_to_tsquery('english', coalesce(p_query, '')) as tsq),
  vec as (
    select id, source_type, source_id, content, metadata,
           1 - (embedding <=> p_embedding) as vscore
    from memories
    where user_id = p_user and embedding is not null
    order by embedding <=> p_embedding
    limit greatest(p_limit * 4, 20)
  ),
  fts as (
    select m.id, m.source_type, m.source_id, m.content, m.metadata,
           ts_rank_cd(m.tsv, q.tsq) as fscore
    from memories m, q
    where m.user_id = p_user and m.tsv @@ q.tsq
    order by fscore desc
    limit greatest(p_limit * 4, 20)
  ),
  merged as (
    select coalesce(v.id, f.id) as id,
           coalesce(v.source_type, f.source_type) as source_type,
           coalesce(v.source_id, f.source_id) as source_id,
           coalesce(v.content, f.content) as content,
           coalesce(v.metadata, f.metadata) as metadata,
           coalesce(v.vscore, 0) * 0.7 + coalesce(f.fscore, 0) * 0.3 as score
    from vec v full outer join fts f using (id)
  )
  select id, source_type, source_id, content, metadata, score
  from merged
  order by score desc
  limit p_limit;
$$;

-- =====================================================================
-- Agent run log (for traceability and resumability)
-- =====================================================================

create table if not exists agent_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  input jsonb not null,
  output jsonb,
  status text not null default 'running' check (status in ('running','done','error')),
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists agent_runs_user_idx on agent_runs (user_id, created_at desc);

-- =====================================================================
-- Row-Level Security
-- =====================================================================

alter table goals           enable row level security;
alter table tasks           enable row level security;
alter table task_deps       enable row level security;
alter table habits          enable row level security;
alter table habit_logs      enable row level security;
alter table journal_entries enable row level security;
alter table events          enable row level security;
alter table memories        enable row level security;
alter table agent_runs      enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'goals','tasks','task_deps','habits','habit_logs',
    'journal_entries','events','memories','agent_runs'
  ]) loop
    execute format('drop policy if exists %I on %I', t || '_owner', t);
    execute format(
      'create policy %I on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_owner', t
    );
  end loop;
end$$;

-- Auto-update updated_at trigger
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end$$;

do $$
declare t text;
begin
  for t in select unnest(array['goals','tasks','journal_entries']) loop
    execute format('drop trigger if exists %I on %I', t || '_set_updated', t);
    execute format(
      'create trigger %I before update on %I for each row execute function set_updated_at()',
      t || '_set_updated', t
    );
  end loop;
end$$;
