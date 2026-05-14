import { Router } from 'express';
import { wrap, HttpError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { embed } from '../lib/embeddings.js';

const router = Router();
router.use(requireAuth);

// Chunk on paragraph boundaries, capping each chunk to ~1200 chars.
function chunk(text, maxLen = 1200) {
  const paragraphs = String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length > maxLen && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

router.post('/', wrap(async (req, res) => {
  const { source_type = 'note', source_id, content, metadata = {} } = req.body || {};
  if (!content || typeof content !== 'string') throw new HttpError(400, 'content_required');
  const chunks = chunk(content);
  const embeddings = await embed(chunks, { inputType: 'document' });
  const rows = chunks.map((c, i) => ({
    user_id: req.user.id,
    source_type, source_id: source_id || null,
    content: c, embedding: embeddings[i] || null,
    metadata: { ...metadata, chunk: i, total: chunks.length },
  }));
  const { data, error } = await req.db.from('memories').insert(rows).select('id');
  if (error) throw error;
  res.status(201).json({ inserted: data.length, chunks: chunks.length });
}));

router.post('/search', wrap(async (req, res) => {
  const { query, limit = 8 } = req.body || {};
  if (!query) throw new HttpError(400, 'query_required');
  const { searchMemories } = await import('../lib/retrieval.js');
  const results = await searchMemories(req.db, req.user.id, query, { limit });
  res.json({ results });
}));

export default router;
