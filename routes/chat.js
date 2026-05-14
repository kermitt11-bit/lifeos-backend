import { Router } from 'express';
import { wrap, HttpError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { searchMemories } from '../lib/retrieval.js';
import { streamComplete } from '../lib/anthropic.js';
import { openSSE } from '../lib/sse.js';
import { hasLLM } from '../lib/env.js';

const router = Router();
router.use(requireAuth);

const SYSTEM = `You are the Life OS oracle.

You answer questions grounded in the user's own data: journal entries, goals,
tasks, and notes. Cite sources inline using square-bracket numbers like [1], [2]
that map to the provided context items. If the context is insufficient, say so
plainly and ask one clarifying question. Stay concise.`;

function buildContextBlock(results) {
  if (!results.length) return 'No relevant context was found.';
  return results
    .map((r, i) => `[${i + 1}] (${r.source_type}) ${r.content}`)
    .join('\n\n');
}

router.post('/', wrap(async (req, res) => {
  if (!hasLLM()) throw new HttpError(503, 'llm_not_configured');
  const { message, history = [], k = 6 } = req.body || {};
  if (!message) throw new HttpError(400, 'message_required');

  const hits = await searchMemories(req.db, req.user.id, message, { limit: k });
  const context = buildContextBlock(hits);
  const messages = [
    ...history,
    {
      role: 'user',
      content: `Question: ${message}\n\n--- Context ---\n${context}\n--- End Context ---`,
    },
  ];

  const sse = openSSE(res);
  sse.send('citations', hits.map((h, i) => ({
    n: i + 1, source_type: h.source_type, source_id: h.source_id,
    snippet: h.content.slice(0, 280), score: h.score,
  })));

  try {
    let fullText = '';
    for await (const evt of streamComplete({ system: SYSTEM, messages, maxTokens: 1024 })) {
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        fullText += evt.delta.text;
        sse.send('delta', { text: evt.delta.text });
      } else if (evt.type === 'message_stop') {
        break;
      }
    }
    sse.send('done', { text: fullText });
  } catch (e) {
    sse.send('error', { message: String(e?.message || e) });
  } finally {
    sse.close();
  }
}));

export default router;
