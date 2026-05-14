# lifeos-backend

An agentic personal Life-OS backend with a mobile-first SPA. A single Express
service on Vercel that runs on top of Supabase (Postgres + RLS + pgvector) and
Claude — or in **demo mode** entirely in-memory, no setup required.

It bundles three things people usually ship separately:

1. **Structured Life-OS data model** — goals, tasks (with a dependency DAG),
   habits + logs, journal entries, calendar events.
2. **An agentic planner endpoint** — Claude with first-class tool-calling that
   can create/update tasks, schedule events, log habits, and write journal
   entries on behalf of the authenticated user. Falls back to a pattern-matched
   local agent when no Anthropic key is configured, so the demo UI still works.
3. **Personal RAG over your own data** — hybrid (pgvector + Postgres FTS)
   retrieval with cited, streaming answers, plus auto-ingestion of every write.

The bundled SPA at `/` is a mobile-first PWA-installable web app with screens
for chat, tasks, goals, habits, journal, and the auto-scheduler. Open it on
your phone and add to home screen.

## Architecture

```
client ─── JWT ───▶  Express (api/index.js)
                      │
                      ├─ /api/{goals,tasks,habits,journal,events}      CRUD
                      ├─ /api/ingest          chunk → embed → memories
                      ├─ /api/chat            RAG + SSE streaming (Claude)
                      ├─ /api/plan/{preview,apply}    DAG + critical path
                      │                                + greedy calendar fit
                      ├─ /api/agent           tool-calling loop (Claude)
                      ├─ /api/review/weekly   structured weekly review
                      └─ /cron/*              daily / weekly Vercel cron
                      │
                      ▼
                Supabase (Postgres + RLS + pgvector + FTS)
```

Auth: every `/api/*` request carries `Authorization: Bearer <supabase JWT>`.
The Supabase client is per-request and configured with the user's token, so RLS
enforces row ownership in Postgres — the service never trusts `req.user.id` for
authorization, only for outgoing writes that need a `user_id` column.

## Setup

### Demo mode (no setup)

`npm install && DEMO_MODE=1 npm run dev`, then open
`http://localhost:3000/` on your phone (same Wi-Fi). Every request without a
`SUPABASE_URL` is served from an in-memory store keyed by an `X-Demo-User`
header that the SPA sets from `localStorage`. Data lives only as long as the
Node process. The Vercel deploy of this branch already runs in demo mode
unless you set Supabase env vars.

### Production mode

1. Create a Supabase project. In the SQL editor, run `db/schema.sql`. It enables
   `pgvector`, creates all tables with RLS, and installs the `match_memories`
   hybrid-retrieval function.
2. Copy `.env.example` to `.env` and fill in keys. Without `ANTHROPIC_API_KEY`
   the agent endpoint uses a pattern-matched fallback; without `VOYAGE_API_KEY`
   retrieval falls back to keyword-only search.
3. `npm install && npm run dev`.

## Endpoints

### CRUD
- `GET/POST/PATCH/DELETE /api/goals`
- `GET/POST/PATCH/DELETE /api/tasks` — supports `?status=`, `?goal_id=`
- `POST /api/tasks/:id/dependencies { parent_id }` — refuses cycles
- `GET  /api/tasks/graph/critical-path` — ES/EF/slack + critical chain
- `GET/POST/PATCH /api/habits`, `POST /api/habits/:id/log`, `GET /api/habits/:id/streak`
- `GET/POST/PATCH/DELETE /api/journal`
- `GET/POST/PATCH/DELETE /api/events`

### Memory + RAG
- `POST /api/ingest { source_type, source_id?, content, metadata? }` — splits
  on paragraph boundaries (max ~1.2k chars), embeds via Voyage, stores in
  `memories`.
- `POST /api/ingest/search { query, limit? }` — hybrid search.

### Planner
- `POST /api/plan/preview { horizonDays?, workStartHour?, workEndHour? }` —
  topo-sorts the open task graph, computes the critical path, and greedy-fits
  every task into free calendar slots within working hours.
- `POST /api/plan/apply` — same, but writes `scheduled_start/end` to tasks.

### Agentic chat
- `POST /api/chat { message, history?, k? }` — Server-Sent Events. Emits
  `citations` (the context the model saw), repeated `delta` chunks, then `done`.
- `POST /api/agent { message, history? }` — runs the tool-calling loop. Each
  call is logged to `agent_runs` so you can audit what the agent touched.
- `POST /api/review/weekly` — structured JSON weekly review.

### Cron (Vercel)
- `POST /cron/daily-summary` — re-auto-schedules every active user, writes a
  short "today" memory chunk.
- `POST /cron/weekly-review` — generates a structured review per user and
  stores it as a memory.

Both require `x-cron-secret: $CRON_SECRET` (or `?secret=` for Vercel-style
cron). They use the service-role client; everything else is RLS-scoped.

## Tool surface exposed to the agent

`list_tasks`, `create_task` (with `depends_on`), `update_task`, `create_goal`,
`log_habit`, `create_event`, `create_journal_entry`, `search_memory`. Each
write also upserts an embedding into `memories`, so the agent's future
`search_memory` calls can find what it just created.

## Notes

- Embeddings are 1024-dim (Voyage default). If you swap providers, update
  `EMBED_DIM` in `lib/embeddings.js` and the `vector(1024)` column type in
  `db/schema.sql`.
- The auto-scheduler operates in UTC by default. Pass `workStartHour` /
  `workEndHour` per request, or compute them server-side from a user
  preferences table you can add later.
- `match_memories` blends vector cosine (0.7) and FTS rank (0.3). Tune the
  weights in `db/schema.sql`.
