import { Router } from 'express';
import { wrap, HttpError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { complete } from '../lib/anthropic.js';
import { hasLLM } from '../lib/env.js';

const router = Router();
router.use(requireAuth);

const SYSTEM = `You are a thoughtful life coach producing a weekly review.

Return a JSON object with this exact shape:
{
  "wins": string[],
  "patterns": string[],
  "blockers": string[],
  "focus_for_next_week": string[],
  "questions_for_user": string[]
}
Keep each list to 3-5 items. Be specific and reference real titles/dates.
Output JSON only — no prose, no markdown.`;

async function buildSnapshot(db) {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [{ data: tasksDone }, { data: tasksOpen }, { data: journal }, { data: habits }] =
    await Promise.all([
      db.from('tasks').select('title, priority, completed_at, goal_id')
        .eq('status', 'done').gte('completed_at', since)
        .order('completed_at', { ascending: false }).limit(50),
      db.from('tasks').select('title, priority, due_at, status')
        .in('status', ['todo', 'doing', 'blocked'])
        .order('priority').limit(50),
      db.from('journal_entries').select('title, body, mood, tags, entry_date')
        .gte('entry_date', since.slice(0, 10))
        .order('entry_date', { ascending: false }).limit(20),
      db.from('habit_logs').select('habit_id, logged_at, value, habits(name)')
        .gte('logged_at', since).order('logged_at', { ascending: false }).limit(100),
    ]);
  return {
    completed: tasksDone || [],
    open: tasksOpen || [],
    journal: journal || [],
    habit_logs: habits || [],
  };
}

router.post('/weekly', wrap(async (req, res) => {
  if (!hasLLM()) throw new HttpError(503, 'llm_not_configured');
  const snapshot = await buildSnapshot(req.db);
  const result = await complete({
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Here is the last 7 days of activity as JSON:\n\n${JSON.stringify(snapshot, null, 2)}\n\nGenerate the weekly review JSON.`,
    }],
    maxTokens: 1500,
    temperature: 0.3,
  });
  const text = (result.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = { raw: text };
  }
  res.json({ review: parsed, snapshot });
}));

export default router;
