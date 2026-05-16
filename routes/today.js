import { Router } from 'express';
import { wrap } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const now = new Date();
  const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const sinceWeek = new Date(now.getTime() - 7 * 86400_000);

  const [
    scheduledTasks,
    dueTasks,
    todaysEvents,
    recentJournal,
    activeGoals,
    activeHabits,
  ] = await Promise.all([
    req.db.from('tasks').select('id, title, priority, scheduled_start, scheduled_end, status')
      .gte('scheduled_start', dayStart.toISOString()).lt('scheduled_start', dayEnd.toISOString())
      .order('scheduled_start'),
    req.db.from('tasks').select('id, title, priority, due_at, status')
      .gte('due_at', dayStart.toISOString()).lt('due_at', dayEnd.toISOString())
      .in('status', ['todo', 'doing', 'blocked']),
    req.db.from('events').select('id, title, starts_at, ends_at, location')
      .gte('starts_at', dayStart.toISOString()).lt('starts_at', dayEnd.toISOString())
      .order('starts_at'),
    req.db.from('journal_entries').select('id, title, body, mood, tags, entry_date')
      .gte('entry_date', sinceWeek.toISOString().slice(0, 10))
      .order('entry_date', { ascending: false }).limit(3),
    req.db.from('goals').select('id, title, description')
      .eq('status', 'active').limit(5),
    req.db.from('habits').select('id, name, cadence').eq('active', true).limit(10),
  ]);

  for (const r of [scheduledTasks, dueTasks, todaysEvents, recentJournal, activeGoals, activeHabits]) {
    if (r.error) throw r.error;
  }

  const todayKey = dayStart.toISOString().slice(0, 10);
  const habitStreaks = await Promise.all(
    (activeHabits.data || []).map(async (h) => {
      const { data } = await req.db.from('habit_logs').select('logged_at')
        .eq('habit_id', h.id).gte('logged_at', sinceWeek.toISOString());
      const loggedToday = (data || []).some((r) => r.logged_at.slice(0, 10) === todayKey);
      return { ...h, logged_today: loggedToday, recent_count: (data || []).length };
    }),
  );

  res.json({
    date: todayKey,
    scheduled_tasks: scheduledTasks.data || [],
    due_tasks: dueTasks.data || [],
    events: todaysEvents.data || [],
    recent_journal: recentJournal.data || [],
    active_goals: activeGoals.data || [],
    habits: habitStreaks,
  });
}));

export default router;
