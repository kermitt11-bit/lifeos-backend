import { complete } from './anthropic.js';
import { toolDefs, runTool } from './tools.js';

const SYSTEM = `You are the Life OS planner — a calm, decisive personal operations agent.

You help the user move their life forward. You have tools to read and write tasks,
goals, habits, journal entries, and calendar events on their behalf.

Operating principles:
- Always ground recommendations in the user's actual data. Call search_memory before giving advice on what to do next.
- Prefer concrete, time-bounded next actions over vague suggestions.
- When the user describes work, capture it as tasks. When they reflect, capture it as a journal entry.
- Link tasks to goals where the connection is clear.
- Don't ask permission to use tools — just use them and report what you did.
- Keep the final reply concise (under 200 words). Bullet points welcome.`;

export async function runAgent({ db, userId, userMessage, history = [], maxSteps = 6 }) {
  const messages = [...history, { role: 'user', content: userMessage }];
  const trace = [];

  for (let step = 0; step < maxSteps; step++) {
    const resp = await complete({
      system: SYSTEM,
      messages,
      tools: toolDefs,
      maxTokens: 2048,
    });
    trace.push({ step, stop_reason: resp.stop_reason });

    messages.push({ role: 'assistant', content: resp.content });

    if (resp.stop_reason !== 'tool_use') {
      const text = resp.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return { reply: text, messages, trace };
    }

    const toolResults = [];
    for (const block of resp.content) {
      if (block.type !== 'tool_use') continue;
      try {
        const out = await runTool(block.name, block.input || {}, { db, userId });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(out),
        });
        trace.push({ tool: block.name, ok: true });
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify({ error: String(e?.message || e) }),
          is_error: true,
        });
        trace.push({ tool: block.name, ok: false, error: String(e?.message || e) });
      }
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return { reply: 'I reached the maximum number of planning steps.', messages, trace };
}
