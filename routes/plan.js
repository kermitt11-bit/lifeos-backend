import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { autoSchedule, criticalPath } from '../lib/scheduler.js';

const router = Router();
router.use(requireAuth);

// Preview an auto-schedule without persisting it.
router.post('/preview', wrap(async (req, res) => {
  const horizon = parseInt(req.body?.horizonDays || 7, 10);
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + horizon * 86400_000);

  const [{ data: tasks }, { data: deps }, { data: events }] = await Promise.all([
    req.db.from('tasks').select('*').in('status', ['todo', 'doing', 'blocked']),
    req.db.from('task_deps').select('parent_id, child_id'),
    req.db.from('events').select('starts_at, ends_at')
      .gte('starts_at', now.toISOString()).lte('starts_at', horizonEnd.toISOString()),
  ]);

  const sorted = [...(tasks || [])].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    return ad - bd;
  });

  const cp = criticalPath(sorted, deps || []);
  const plan = autoSchedule(sorted, deps || [], events || [], {
    now,
    workStartHour: req.body?.workStartHour ?? 9,
    workEndHour: req.body?.workEndHour ?? 18,
  });
  res.json({ critical_path: cp, plan });
}));

router.post('/apply', wrap(async (req, res) => {
  const now = new Date();
  const [{ data: tasks }, { data: deps }, { data: events }] = await Promise.all([
    req.db.from('tasks').select('*').in('status', ['todo', 'doing', 'blocked']),
    req.db.from('task_deps').select('parent_id, child_id'),
    req.db.from('events').select('starts_at, ends_at')
      .gte('starts_at', now.toISOString()),
  ]);
  const sorted = [...(tasks || [])].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    return ad - bd;
  });
  const plan = autoSchedule(sorted, deps || [], events || [], { now });
  if (plan.error) return res.status(409).json(plan);

  const updates = await Promise.all(plan.placements.map(async (p) => {
    const { data, error } = await req.db.from('tasks').update({
      scheduled_start: p.start, scheduled_end: p.end,
    }).eq('id', p.task_id).select('id, scheduled_start, scheduled_end').single();
    if (error) return { id: p.task_id, error: error.message };
    return data;
  }));
  res.json({ updated: updates });
}));

export default router;
