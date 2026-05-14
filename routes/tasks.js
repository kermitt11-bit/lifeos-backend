import { Router } from 'express';
import { wrap, HttpError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { pickFields, requireFields } from '../lib/validate.js';
import { upsertMemory } from '../lib/retrieval.js';
import { criticalPath, topoSort } from '../lib/scheduler.js';

const router = Router();
router.use(requireAuth);

const WRITABLE = [
  'title', 'notes', 'status', 'priority', 'estimate_minutes',
  'due_at', 'scheduled_start', 'scheduled_end', 'goal_id', 'completed_at',
];

router.get('/', wrap(async (req, res) => {
  let q = req.db.from('tasks').select('*').order('priority').order('due_at', { ascending: true });
  if (req.query.status) q = q.eq('status', req.query.status);
  if (req.query.goal_id) q = q.eq('goal_id', req.query.goal_id);
  const { data, error } = await q;
  if (error) throw error;
  res.json({ tasks: data });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['title']);
  const insert = { ...pickFields(req.body, WRITABLE), user_id: req.user.id };
  const { data, error } = await req.db.from('tasks').insert(insert).select().single();
  if (error) throw error;
  if (Array.isArray(req.body.depends_on) && req.body.depends_on.length) {
    const edges = req.body.depends_on.map((parent_id) => ({
      parent_id, child_id: data.id, user_id: req.user.id,
    }));
    const { error: e2 } = await req.db.from('task_deps').insert(edges);
    if (e2) throw e2;
  }
  await upsertMemory(req.db, {
    userId: req.user.id, sourceType: 'task', sourceId: data.id,
    content: `Task: ${data.title}\n${data.notes || ''}`,
    metadata: { status: data.status, priority: data.priority },
  });
  res.status(201).json({ task: data });
}));

router.patch('/:id', wrap(async (req, res) => {
  const updates = pickFields(req.body, WRITABLE);
  if (updates.status === 'done' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  const { data, error } = await req.db
    .from('tasks').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ task: data });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { error } = await req.db.from('tasks').delete().eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
}));

router.post('/:id/dependencies', wrap(async (req, res) => {
  requireFields(req.body, ['parent_id']);
  if (req.body.parent_id === req.params.id) {
    throw new HttpError(400, 'self_dependency_forbidden');
  }
  const { data: existing } = await req.db
    .from('tasks').select('id').in('id', [req.body.parent_id, req.params.id]);
  if ((existing || []).length !== 2) throw new HttpError(404, 'task_not_found');

  const { data: tasks } = await req.db.from('tasks').select('id');
  const { data: deps } = await req.db.from('task_deps').select('parent_id, child_id');
  const probe = [...(deps || []), { parent_id: req.body.parent_id, child_id: req.params.id }];
  const result = topoSort(tasks || [], probe);
  if (result.error) throw new HttpError(409, 'would_create_cycle', result);

  const { error } = await req.db.from('task_deps').insert({
    parent_id: req.body.parent_id, child_id: req.params.id, user_id: req.user.id,
  });
  if (error) throw error;
  res.status(201).json({ ok: true });
}));

router.delete('/:id/dependencies/:parentId', wrap(async (req, res) => {
  const { error } = await req.db
    .from('task_deps')
    .delete()
    .match({ child_id: req.params.id, parent_id: req.params.parentId });
  if (error) throw error;
  res.status(204).end();
}));

router.get('/graph/critical-path', wrap(async (req, res) => {
  const { data: tasks, error: e1 } = await req.db
    .from('tasks').select('id, title, estimate_minutes, status')
    .in('status', ['todo', 'doing', 'blocked']);
  if (e1) throw e1;
  const { data: deps, error: e2 } = await req.db
    .from('task_deps').select('parent_id, child_id');
  if (e2) throw e2;
  const result = criticalPath(tasks || [], deps || []);
  res.json(result);
}));

export default router;
