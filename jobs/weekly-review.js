// Weekly cron: generate per-user weekly review and store as memory.

import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireCron } from '../lib/auth.js';
import { adminClient } from '../lib/supabase.js';
import { complete } from '../lib/anthropic.js';
import { upsertMemory } from '../lib/retrieval.js';
import { hasLLM } from '../lib/env.js';

const router = Router();
router.use(requireCron);

const SYSTEM = `Produce a JSON weekly review with keys: wins, patterns, blockers,
focus_for_next_week, questions_for_user. 3-5 items each. JSON only.`;

async function processUser(admin, userId) {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [{ data: tasksDone }, { data: open }, { data: journal }] = await Promise.all([
    admin.from('tasks').select('title, priority, completed_at')
      .eq('user_id', userId).eq('status', 'done').gte('completed_at', since).limit(50),
    admin.from('tasks').select('title, priority, due_at, status')
      .eq('user_id', userId).in('status', ['todo', 'doing', 'blocked']).limit(50),
    admin.from('journal_entries').select('title, body, mood, entry_date')
      .eq('user_id', userId).gte('entry_date', since.slice(0, 10)).limit(20),
  ]);

  const snapshot = { completed: tasksDone || [], open: open || [], journal: journal || [] };
  const r = await complete({
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Last 7 days:\n${JSON.stringify(snapshot)}\n\nReturn JSON.`,
    }],
    maxTokens: 1500, temperature: 0.3,
  });
  const text = (r.content || []).filter((b) => b.type === 'text')
    .map((b) => b.text).join('').trim();
  let parsed = null;
  try {
    const m = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(m ? m[0] : text);
  } catch { /* leave null */ }

  await upsertMemory(admin, {
    userId, sourceType: 'weekly_review',
    content: text, metadata: { week_of: since.slice(0, 10), parsed },
  });
  return { userId, ok: true };
}

router.post('/', wrap(async (_req, res) => {
  if (!hasLLM()) return res.status(503).json({ error: 'llm_not_configured' });
  const admin = adminClient();
  const { data } = await admin.from('journal_entries').select('user_id').limit(1000);
  const users = Array.from(new Set((data || []).map((r) => r.user_id)));
  const results = [];
  for (const id of users) {
    try { results.push(await processUser(admin, id)); }
    catch (e) { results.push({ userId: id, error: String(e?.message || e) }); }
  }
  res.json({ processed: results.length, results });
}));

export default router;
