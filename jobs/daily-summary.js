// Run daily via Vercel cron with x-cron-secret header.
// Walks every active user, refreshes scheduled_start/end via auto-scheduling,
// and produces a journal-style "today" memory chunk if the LLM is configured.

import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireCron } from '../lib/auth.js';
import { adminClient } from '../lib/supabase.js';
import { autoSchedule } from '../lib/scheduler.js';
import { upsertMemory } from '../lib/retrieval.js';
import { complete } from '../lib/anthropic.js';
import { hasLLM } from '../lib/env.js';

const router = Router();
router.use(requireCron);

async function activeUserIds(admin) {
  const { data, error } = await admin
    .from('tasks').select('user_id')
    .in('status', ['todo', 'doing', 'blocked']);
  if (error) throw error;
  return Array.from(new Set((data || []).map((r) => r.user_id)));
}

async function processUser(admin, userId) {
  const now = new Date();
  const [{ data: tasks }, { data: deps }, { data: events }] = await Promise.all([
    admin.from('tasks').select('*').eq('user_id', userId)
      .in('status', ['todo', 'doing', 'blocked']),
    admin.from('task_deps').select('parent_id, child_id').eq('user_id', userId),
    admin.from('events').select('starts_at, ends_at')
      .eq('user_id', userId).gte('starts_at', now.toISOString()),
  ]);
  if (!tasks || !tasks.length) return { userId, scheduled: 0 };

  const sorted = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    return ad - bd;
  });
  const plan = autoSchedule(sorted, deps || [], events || [], { now });
  if (plan.error) return { userId, error: plan.error };

  let scheduled = 0;
  for (const p of plan.placements) {
    await admin.from('tasks').update({
      scheduled_start: p.start, scheduled_end: p.end,
    }).eq('id', p.task_id);
    scheduled++;
  }

  if (hasLLM()) {
    const recent = sorted.slice(0, 12).map((t) => `- ${t.title}`).join('\n');
    try {
      const r = await complete({
        system: 'Write a single short paragraph (<=80 words) capturing the day\'s focus, second-person.',
        messages: [{ role: 'user', content: `Today's plan:\n${recent}` }],
        maxTokens: 200, temperature: 0.5,
      });
      const text = (r.content || []).filter((b) => b.type === 'text')
        .map((b) => b.text).join('').trim();
      if (text) {
        await upsertMemory(admin, {
          userId, sourceType: 'daily_brief',
          content: text, metadata: { date: now.toISOString().slice(0, 10) },
        });
      }
    } catch (e) {
      console.warn('[daily-summary] llm error for', userId, e.message);
    }
  }
  return { userId, scheduled };
}

router.post('/', wrap(async (_req, res) => {
  const admin = adminClient();
  const users = await activeUserIds(admin);
  const results = [];
  for (const id of users) {
    try { results.push(await processUser(admin, id)); }
    catch (e) { results.push({ userId: id, error: String(e?.message || e) }); }
  }
  res.json({ processed: results.length, results });
}));

export default router;
