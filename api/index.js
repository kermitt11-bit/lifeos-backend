import express from 'express';
import cors from 'cors';
import { env } from '../lib/env.js';
import { errorMiddleware } from '../lib/errors.js';

import goals from '../routes/goals.js';
import tasks from '../routes/tasks.js';
import habits from '../routes/habits.js';
import journal from '../routes/journal.js';
import events from '../routes/events.js';
import ingest from '../routes/ingest.js';
import chat from '../routes/chat.js';
import plan from '../routes/plan.js';
import agent from '../routes/agent.js';
import review from '../routes/review.js';
import dailySummary from '../jobs/daily-summary.js';
import weeklyReview from '../jobs/weekly-review.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/', (_req, res) => res.json({
  name: 'lifeos-backend',
  endpoints: [
    'GET  /health',
    'CRUD /api/goals',
    'CRUD /api/tasks  (+ /dependencies, /graph/critical-path)',
    'CRUD /api/habits (+ /:id/log, /:id/streak)',
    'CRUD /api/journal',
    'CRUD /api/events',
    'POST /api/ingest, POST /api/ingest/search',
    'POST /api/chat       (SSE, RAG grounded)',
    'POST /api/plan/preview, /api/plan/apply',
    'POST /api/agent       (tool-calling planner)',
    'POST /api/review/weekly',
    'POST /cron/daily-summary, /cron/weekly-review',
  ],
}));

app.use('/api/goals', goals);
app.use('/api/tasks', tasks);
app.use('/api/habits', habits);
app.use('/api/journal', journal);
app.use('/api/events', events);
app.use('/api/ingest', ingest);
app.use('/api/chat', chat);
app.use('/api/plan', plan);
app.use('/api/agent', agent);
app.use('/api/review', review);
app.use('/cron/daily-summary', dailySummary);
app.use('/cron/weekly-review', weeklyReview);

app.use(errorMiddleware);

if (process.env.VERCEL !== '1' && import.meta.url === `file://${process.argv[1]}`) {
  app.listen(env.port, () => {
    console.log(`[lifeos] listening on :${env.port}`);
  });
}

export default app;
