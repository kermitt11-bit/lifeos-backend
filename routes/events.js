import { Router } from 'express';
import { wrap, HttpError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { pickFields, requireFields } from '../lib/validate.js';

const router = Router();
router.use(requireAuth);

const WRITABLE = ['title', 'location', 'starts_at', 'ends_at', 'source', 'external_id'];

router.get('/', wrap(async (req, res) => {
  const from = req.query.from || new Date().toISOString();
  const to = req.query.to || new Date(Date.now() + 14 * 86400_000).toISOString();
  const { data, error } = await req.db
    .from('events').select('*')
    .gte('starts_at', from).lte('starts_at', to)
    .order('starts_at');
  if (error) throw error;
  res.json({ events: data });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['title', 'starts_at', 'ends_at']);
  if (new Date(req.body.ends_at) <= new Date(req.body.starts_at)) {
    throw new HttpError(400, 'ends_at_must_be_after_starts_at');
  }
  const insert = { ...pickFields(req.body, WRITABLE), user_id: req.user.id };
  const { data, error } = await req.db.from('events').insert(insert).select().single();
  if (error) throw error;
  res.status(201).json({ event: data });
}));

router.patch('/:id', wrap(async (req, res) => {
  const updates = pickFields(req.body, WRITABLE);
  const { data, error } = await req.db
    .from('events').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ event: data });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { error } = await req.db.from('events').delete().eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
}));

export default router;
