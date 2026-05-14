import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { pickFields, requireFields } from '../lib/validate.js';
import { upsertMemory } from '../lib/retrieval.js';

const router = Router();
router.use(requireAuth);

const WRITABLE = ['title', 'body', 'mood', 'tags', 'entry_date'];

router.get('/', wrap(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  let q = req.db.from('journal_entries').select('*')
    .order('entry_date', { ascending: false }).limit(limit);
  if (req.query.from) q = q.gte('entry_date', req.query.from);
  if (req.query.to) q = q.lte('entry_date', req.query.to);
  const { data, error } = await q;
  if (error) throw error;
  res.json({ entries: data });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['body']);
  const insert = { ...pickFields(req.body, WRITABLE), user_id: req.user.id };
  const { data, error } = await req.db
    .from('journal_entries').insert(insert).select().single();
  if (error) throw error;
  await upsertMemory(req.db, {
    userId: req.user.id, sourceType: 'journal', sourceId: data.id,
    content: `${data.title ? data.title + '\n' : ''}${data.body}`,
    metadata: { mood: data.mood, tags: data.tags, entry_date: data.entry_date },
  });
  res.status(201).json({ entry: data });
}));

router.patch('/:id', wrap(async (req, res) => {
  const updates = pickFields(req.body, WRITABLE);
  const { data, error } = await req.db
    .from('journal_entries').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  if (updates.body !== undefined || updates.title !== undefined) {
    await upsertMemory(req.db, {
      userId: req.user.id, sourceType: 'journal', sourceId: data.id,
      content: `${data.title ? data.title + '\n' : ''}${data.body}`,
      metadata: { mood: data.mood, tags: data.tags, entry_date: data.entry_date },
    });
  }
  res.json({ entry: data });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { error } = await req.db.from('journal_entries').delete().eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
}));

export default router;
