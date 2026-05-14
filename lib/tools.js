import { searchMemories, upsertMemory } from './retrieval.js';

export const toolDefs = [
  {
    name: 'list_tasks',
    description: 'List the user\'s tasks. Filter by status or by goal_id.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'doing', 'blocked', 'done', 'cancelled'] },
        goal_id: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task for the user. Use this when the user mentions something they need to do.',
    input_schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        notes: { type: 'string' },
        goal_id: { type: 'string', description: 'Optional UUID of a goal to attach.' },
        priority: { type: 'integer', minimum: 1, maximum: 5 },
        estimate_minutes: { type: 'integer', minimum: 5 },
        due_at: { type: 'string', description: 'ISO-8601 timestamp.' },
        depends_on: { type: 'array', items: { type: 'string' }, description: 'Task IDs this task depends on.' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task\'s fields (status, priority, notes, scheduled times).',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'doing', 'blocked', 'done', 'cancelled'] },
        priority: { type: 'integer', minimum: 1, maximum: 5 },
        notes: { type: 'string' },
        scheduled_start: { type: 'string' },
        scheduled_end: { type: 'string' },
      },
    },
  },
  {
    name: 'create_goal',
    description: 'Create a higher-level goal the user is working toward.',
    input_schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        target_date: { type: 'string', description: 'ISO date (YYYY-MM-DD).' },
      },
    },
  },
  {
    name: 'log_habit',
    description: 'Log a habit completion or measurement.',
    input_schema: {
      type: 'object',
      required: ['habit_id'],
      properties: {
        habit_id: { type: 'string' },
        value: { type: 'number' },
        note: { type: 'string' },
      },
    },
  },
  {
    name: 'create_event',
    description: 'Create a calendar event.',
    input_schema: {
      type: 'object',
      required: ['title', 'starts_at', 'ends_at'],
      properties: {
        title: { type: 'string' },
        starts_at: { type: 'string' },
        ends_at: { type: 'string' },
        location: { type: 'string' },
      },
    },
  },
  {
    name: 'create_journal_entry',
    description: 'Persist a journal entry. Use this when the user reflects, vents, or shares thoughts.',
    input_schema: {
      type: 'object',
      required: ['body'],
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        mood: { type: 'integer', minimum: 1, maximum: 10 },
        tags: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'search_memory',
    description: 'Semantic + keyword search across the user\'s journal entries, goals, tasks, and notes. Use to ground responses.',
    input_schema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 6 },
      },
    },
  },
];

export async function runTool(name, args, ctx) {
  const { db, userId } = ctx;
  switch (name) {
    case 'list_tasks': {
      let q = db.from('tasks').select('id,title,status,priority,due_at,goal_id,scheduled_start');
      if (args.status) q = q.eq('status', args.status);
      if (args.goal_id) q = q.eq('goal_id', args.goal_id);
      const { data, error } = await q.limit(args.limit || 25).order('priority').order('due_at');
      if (error) throw error;
      return { tasks: data };
    }
    case 'create_task': {
      const { depends_on, ...fields } = args;
      const insert = { ...fields, user_id: userId };
      const { data, error } = await db.from('tasks').insert(insert).select().single();
      if (error) throw error;
      if (Array.isArray(depends_on) && depends_on.length) {
        const edges = depends_on.map((parent_id) => ({
          parent_id, child_id: data.id, user_id: userId,
        }));
        const { error: e2 } = await db.from('task_deps').insert(edges);
        if (e2) throw e2;
      }
      await upsertMemory(db, {
        userId, sourceType: 'task', sourceId: data.id,
        content: `Task: ${data.title}\n${data.notes || ''}`,
        metadata: { status: data.status, priority: data.priority },
      });
      return { task: data };
    }
    case 'update_task': {
      const { id, ...fields } = args;
      if (fields.status === 'done' && !fields.completed_at) fields.completed_at = new Date().toISOString();
      const { data, error } = await db.from('tasks').update(fields).eq('id', id).select().single();
      if (error) throw error;
      return { task: data };
    }
    case 'create_goal': {
      const { data, error } = await db
        .from('goals').insert({ ...args, user_id: userId }).select().single();
      if (error) throw error;
      await upsertMemory(db, {
        userId, sourceType: 'goal', sourceId: data.id,
        content: `Goal: ${data.title}\n${data.description || ''}`,
      });
      return { goal: data };
    }
    case 'log_habit': {
      const { data, error } = await db
        .from('habit_logs').insert({ ...args, user_id: userId }).select().single();
      if (error) throw error;
      return { log: data };
    }
    case 'create_event': {
      const { data, error } = await db
        .from('events').insert({ ...args, user_id: userId, source: 'agent' }).select().single();
      if (error) throw error;
      return { event: data };
    }
    case 'create_journal_entry': {
      const { data, error } = await db
        .from('journal_entries').insert({ ...args, user_id: userId }).select().single();
      if (error) throw error;
      await upsertMemory(db, {
        userId, sourceType: 'journal', sourceId: data.id,
        content: `${data.title ? data.title + '\n' : ''}${data.body}`,
        metadata: { mood: data.mood, tags: data.tags },
      });
      return { entry: data };
    }
    case 'search_memory': {
      const hits = await searchMemories(db, userId, args.query, { limit: args.limit || 6 });
      return { results: hits };
    }
    default:
      throw new Error(`unknown_tool: ${name}`);
  }
}
