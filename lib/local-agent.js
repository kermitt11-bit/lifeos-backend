// Fallback agent used when ANTHROPIC_API_KEY is not configured.
// Pattern-matches common phrasings so the demo UI works without an LLM.
import { runTool } from './tools.js';

const PATTERNS = [
  {
    test: /^(?:show|list|what(?:'s| is) on)\b.*\b(?:tasks?|to[- ]?do)\b/i,
    handler: async (_m, ctx) => {
      const out = await runTool('list_tasks', { status: 'todo', limit: 20 }, ctx);
      const lines = (out.tasks || []).slice(0, 10).map((t) => `• ${t.title}${t.due_at ? ` (due ${t.due_at.slice(0,10)})` : ''}`);
      return lines.length ? `Open tasks:\n${lines.join('\n')}` : 'No open tasks.';
    },
  },
  {
    test: /^(?:add|create|new)\s+task[:\s]+(.+)/i,
    handler: async (m, ctx) => {
      const title = m[1].trim().replace(/[.!]+$/, '');
      const out = await runTool('create_task', { title }, ctx);
      return `Created task: ${out.task.title}`;
    },
  },
  {
    test: /^(?:add|create|new)\s+goal[:\s]+(.+)/i,
    handler: async (m, ctx) => {
      const title = m[1].trim().replace(/[.!]+$/, '');
      const out = await runTool('create_goal', { title }, ctx);
      return `Created goal: ${out.goal.title}`;
    },
  },
  {
    test: /^(?:journal|note|log)[:\s]+(.+)/is,
    handler: async (m, ctx) => {
      const body = m[1].trim();
      const out = await runTool('create_journal_entry', { body }, ctx);
      return `Journaled (${out.entry.entry_date}).`;
    },
  },
  {
    test: /^(?:search|find|recall)[:\s]+(.+)/i,
    handler: async (m, ctx) => {
      const out = await runTool('search_memory', { query: m[1].trim(), limit: 5 }, ctx);
      const lines = (out.results || []).map((r, i) => `[${i+1}] (${r.source_type}) ${r.content.slice(0,160)}`);
      return lines.length ? lines.join('\n\n') : 'No matches found.';
    },
  },
  {
    test: /\b(?:help|commands?|what can you do)\b/i,
    handler: async () => [
      'I\'m running in demo mode without an LLM key. Try:',
      '  • show my tasks',
      '  • add task: Email Sara back',
      '  • add goal: Learn to surf',
      '  • journal: Felt energized after the run',
      '  • search: running shoes',
      '',
      'Set ANTHROPIC_API_KEY for full natural-language agent.',
    ].join('\n'),
  },
];

export async function runLocalAgent({ message, db, userId }) {
  const ctx = { db, userId };
  for (const { test, handler } of PATTERNS) {
    const m = test.exec(message);
    if (m) {
      try {
        const reply = await handler(m, ctx);
        return { reply, trace: [{ matched: test.source }] };
      } catch (e) {
        return { reply: `Error: ${e?.message || e}`, trace: [{ error: String(e) }] };
      }
    }
  }
  return {
    reply:
      'I didn\'t recognize that command. In demo mode I respond to: "show my tasks", "add task: ...", "add goal: ...", "journal: ...", "search: ...". Type "help" for the full list. Set ANTHROPIC_API_KEY for the real agent.',
    trace: [{ matched: null }],
  };
}
