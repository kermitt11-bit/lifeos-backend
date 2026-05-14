// In-memory Supabase-shaped client used when DEMO_MODE=1.
// Implements just enough of the @supabase/supabase-js query builder to power
// the routes in this app. Data lives in a module-scoped object so it survives
// across requests within the same Node process (Vercel keeps warm containers).

import crypto from 'node:crypto';

const TABLES = [
  'goals', 'tasks', 'task_deps', 'habits', 'habit_logs',
  'journal_entries', 'events', 'memories', 'agent_runs',
];
const HAS_USER_ID = new Set(TABLES);

const store = { tables: Object.fromEntries(TABLES.map((t) => [t, []])), seeded: new Set() };

function uuid() { return crypto.randomUUID(); }

function cmp(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

class Query {
  constructor(table, userId) {
    this.table = table;
    this.userId = userId;
    this.filters = HAS_USER_ID.has(table) ? [(r) => r.user_id === userId] : [];
    this.sorts = [];
    this.limit_ = null;
    this.action = 'select';
    this.payload = null;
    this.singleMode = false;
    this.maybeSingleMode = false;
    this.textCol = null;
  }

  select() { return this; }
  eq(col, val) { this.filters.push((r) => r[col] === val); return this; }
  neq(col, val) { this.filters.push((r) => r[col] !== val); return this; }
  in(col, vals) { this.filters.push((r) => vals.includes(r[col])); return this; }
  gte(col, val) { this.filters.push((r) => r[col] != null && r[col] >= val); return this; }
  lte(col, val) { this.filters.push((r) => r[col] != null && r[col] <= val); return this; }
  gt(col, val) { this.filters.push((r) => r[col] != null && r[col] > val); return this; }
  lt(col, val) { this.filters.push((r) => r[col] != null && r[col] < val); return this; }
  match(obj) { for (const [k, v] of Object.entries(obj)) this.eq(k, v); return this; }
  order(col, opts = {}) {
    this.sorts.push({ col, asc: opts.ascending !== false });
    return this;
  }
  limit(n) { this.limit_ = n; return this; }
  single() { this.singleMode = true; return this; }
  maybeSingle() { this.maybeSingleMode = true; return this; }
  textSearch(col, query) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    this.filters.push((r) => {
      const txt = String(r[col] || r.content || '').toLowerCase();
      return words.every((w) => txt.includes(w));
    });
    return this;
  }

  insert(payload) { this.action = 'insert'; this.payload = payload; return this; }
  update(fields)  { this.action = 'update'; this.payload = fields;  return this; }
  upsert(payload) { this.action = 'insert'; this.payload = payload; return this; }
  delete()        { this.action = 'delete'; return this; }

  async _execute() {
    const rows = store.tables[this.table] || (store.tables[this.table] = []);
    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const now = new Date().toISOString();
      const inserted = items.map((r) => {
        const row = { ...r };
        if (HAS_USER_ID.has(this.table) && !row.user_id) row.user_id = this.userId;
        if (!row.id && this.table !== 'task_deps') row.id = uuid();
        if (!row.created_at) row.created_at = now;
        if (!row.updated_at && ['goals', 'tasks', 'journal_entries'].includes(this.table)) {
          row.updated_at = now;
        }
        return row;
      });
      rows.push(...inserted);
      return { data: this.singleMode ? inserted[0] : inserted, error: null };
    }
    if (this.action === 'update') {
      const now = new Date().toISOString();
      const matching = rows.filter((r) => this.filters.every((f) => f(r)));
      for (const r of matching) {
        Object.assign(r, this.payload);
        if (['goals', 'tasks', 'journal_entries'].includes(this.table)) r.updated_at = now;
      }
      const out = this.singleMode ? (matching[0] || null) : matching;
      return { data: out, error: null };
    }
    if (this.action === 'delete') {
      const remaining = rows.filter((r) => !this.filters.every((f) => f(r)));
      store.tables[this.table] = remaining;
      return { data: null, error: null };
    }
    let result = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.sorts.length) {
      result = [...result].sort((a, b) => {
        for (const { col, asc } of this.sorts) {
          const c = cmp(a[col], b[col]);
          if (c !== 0) return asc ? c : -c;
        }
        return 0;
      });
    }
    if (this.limit_ != null) result = result.slice(0, this.limit_);
    if (this.singleMode) {
      if (result.length === 0) return { data: null, error: { code: 'PGRST116', message: 'no_rows' } };
      return { data: result[0], error: null };
    }
    if (this.maybeSingleMode) return { data: result[0] || null, error: null };
    return { data: result, error: null };
  }

  then(onF, onR) { return this._execute().then(onF, onR); }
  catch(onR)     { return this._execute().catch(onR); }
  finally(fn)    { return this._execute().finally(fn); }
}

export class MemClient {
  constructor(userId) { this.userId = userId; }
  from(table) { return new Query(table, this.userId); }
  async rpc(name, params) {
    if (name === 'match_memories') {
      const all = (store.tables.memories || []).filter((m) => m.user_id === params.p_user);
      const q = String(params.p_query || '').toLowerCase().split(/\s+/).filter(Boolean);
      const scored = all.map((m) => {
        const t = String(m.content || '').toLowerCase();
        const score = q.length === 0 ? 0 : q.reduce((s, w) => s + (t.includes(w) ? 1 : 0), 0) / q.length;
        return {
          id: m.id, source_type: m.source_type, source_id: m.source_id,
          content: m.content, metadata: m.metadata, score,
        };
      }).filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, params.p_limit || 8);
      return { data: scored, error: null };
    }
    return { data: null, error: { message: `rpc_not_implemented: ${name}` } };
  }
}

export function memstoreRaw() { return store; }

// Idempotent demo seed for a given user.
export function seedDemoUser(userId) {
  if (store.seeded.has(userId)) return;
  store.seeded.add(userId);
  const now = new Date();
  const iso = (offsetMin) => new Date(now.getTime() + offsetMin * 60_000).toISOString();
  const today = now.toISOString().slice(0, 10);

  const g1 = uuid();
  store.tables.goals.push({
    id: g1, user_id: userId, title: 'Ship Life OS v1',
    description: 'A weekend project: turn the planner into something I actually use.',
    status: 'active', target_date: null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
  });
  const g2 = uuid();
  store.tables.goals.push({
    id: g2, user_id: userId, title: 'Run a half marathon',
    description: 'Build endurance gradually over 12 weeks.',
    status: 'active', target_date: null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
  });

  const t1 = uuid(), t2 = uuid(), t3 = uuid(), t4 = uuid();
  const tBase = { user_id: userId, status: 'todo', created_at: now.toISOString(), updated_at: now.toISOString(), completed_at: null, scheduled_start: null, scheduled_end: null, due_at: null, notes: null };
  store.tables.tasks.push(
    { ...tBase, id: t1, goal_id: g1, title: 'Write README for Life OS', priority: 2, estimate_minutes: 30 },
    { ...tBase, id: t2, goal_id: g1, title: 'Wire up daily review cron', priority: 3, estimate_minutes: 45 },
    { ...tBase, id: t3, goal_id: g2, title: 'Easy 3-mile run', priority: 2, estimate_minutes: 30 },
    { ...tBase, id: t4, goal_id: g2, title: 'Buy new running shoes', priority: 4, estimate_minutes: 60 },
  );
  store.tables.task_deps.push({ parent_id: t4, child_id: t3, user_id: userId });

  const h1 = uuid();
  store.tables.habits.push({
    id: h1, user_id: userId, name: 'Morning meditation',
    cadence: 'daily', target_per_period: 1, active: true,
    created_at: now.toISOString(),
  });
  store.tables.habit_logs.push({
    id: uuid(), user_id: userId, habit_id: h1,
    logged_at: now.toISOString(), value: null, note: 'Felt focused after.',
  });

  store.tables.journal_entries.push({
    id: uuid(), user_id: userId,
    title: 'A good start',
    body: 'Got the Life OS scaffolding running. Surprised how much fits in a single Express app.',
    mood: 8, tags: ['build', 'momentum'], entry_date: today,
    created_at: now.toISOString(), updated_at: now.toISOString(),
  });

  store.tables.events.push({
    id: uuid(), user_id: userId, title: 'Standup',
    starts_at: iso(60), ends_at: iso(90),
    location: null, source: 'manual', external_id: null,
    created_at: now.toISOString(),
  });
}
