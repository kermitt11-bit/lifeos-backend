import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { pickFields, requireFields } from '../lib/validate.js';

const router = Router();
router.use(requireAuth);

const WRITABLE = ['name', 'cadence', 'target_per_period', 'active'];

router.get('/', wrap(async (req, res) => {
  const { data, error } = await req.db
    .from('habits').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ habits: data });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['name']);
  const insert = { ...pickFields(req.body, WRITABLE), user_id: req.user.id };
  const { data, error } = await req.db.from('habits').insert(insert).select().single();
  if (error) throw error;
  res.status(201).json({ habit: data });
}));

router.patch('/:id', wrap(async (req, res) => {
  const { data, error } = await req.db
    .from('habits').update(pickFields(req.body, WRITABLE))
    .eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ habit: data });
}));

router.post('/:id/log', wrap(async (req, res) => {
  const insert = {
    user_id: req.user.id,
    habit_id: req.params.id,
    value: req.body?.value ?? null,
    note: req.body?.note ?? null,
  };
  const { data, error } = await req.db.from('habit_logs').insert(insert).select().single();
  if (error) throw error;
  res.status(201).json({ log: data });
}));

router.get('/:id/streak', wrap(async (req, res) => {
  const { data, error } = await req.db
    .from('habit_logs').select('logged_at')
    .eq('habit_id', req.params.id)
    .order('logged_at', { ascending: false })
    .limit(90);
  if (error) throw error;
  const days = new Set((data || []).map((r) => r.logged_at.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  res.json({ streak, days: days.size });
}));

export default router;
