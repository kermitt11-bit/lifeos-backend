import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { pickFields, requireFields } from '../lib/validate.js';
import { upsertMemory } from '../lib/retrieval.js';

const router = Router();
router.use(requireAuth);

const WRITABLE = ['title', 'description', 'status', 'target_date'];

router.get('/', wrap(async (req, res) => {
  const { data, error } = await req.db
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ goals: data });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['title']);
  const insert = { ...pickFields(req.body, WRITABLE), user_id: req.user.id };
  const { data, error } = await req.db.from('goals').insert(insert).select().single();
  if (error) throw error;
  await upsertMemory(req.db, {
    userId: req.user.id, sourceType: 'goal', sourceId: data.id,
    content: `Goal: ${data.title}\n${data.description || ''}`,
  });
  res.status(201).json({ goal: data });
}));

router.patch('/:id', wrap(async (req, res) => {
  const updates = pickFields(req.body, WRITABLE);
  const { data, error } = await req.db
    .from('goals').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ goal: data });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { error } = await req.db.from('goals').delete().eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
}));

export default router;
