import { Router } from 'express';
import { wrap, HttpError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { runAgent } from '../lib/agent.js';
import { runLocalAgent } from '../lib/local-agent.js';
import { hasLLM } from '../lib/env.js';

const router = Router();
router.use(requireAuth);

router.post('/', wrap(async (req, res) => {
  const { message, history = [] } = req.body || {};
  if (!message) throw new HttpError(400, 'message_required');

  const { data: run, error: re } = await req.db
    .from('agent_runs').insert({
      user_id: req.user.id, kind: hasLLM() ? 'planner' : 'planner_demo',
      input: { message }, status: 'running',
    }).select().single();
  if (re) throw re;

  try {
    const result = hasLLM()
      ? await runAgent({ db: req.db, userId: req.user.id, userMessage: message, history })
      : await runLocalAgent({ message, db: req.db, userId: req.user.id });
    await req.db.from('agent_runs').update({
      status: 'done',
      output: { reply: result.reply, trace: result.trace },
      completed_at: new Date().toISOString(),
    }).eq('id', run.id);
    res.json({ run_id: run.id, reply: result.reply, trace: result.trace, mode: hasLLM() ? 'llm' : 'demo' });
  } catch (e) {
    await req.db.from('agent_runs').update({
      status: 'error', error: String(e?.message || e),
      completed_at: new Date().toISOString(),
    }).eq('id', run.id);
    throw e;
  }
}));

router.get('/runs', wrap(async (req, res) => {
  const { data, error } = await req.db
    .from('agent_runs').select('*')
    .order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  res.json({ runs: data });
}));

export default router;
