import { embedOne } from './embeddings.js';
import { EMBED_DIM } from './embeddings.js';

export async function searchMemories(db, userId, query, { limit = 8 } = {}) {
  const emb = await embedOne(query, { inputType: 'query' });
  if (!emb) {
    const { data, error } = await db
      .from('memories')
      .select('id, source_type, source_id, content, metadata')
      .textSearch('tsv', query, { type: 'websearch', config: 'english' })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((r) => ({ ...r, score: 0 }));
  }
  const { data, error } = await db.rpc('match_memories', {
    p_user: userId,
    p_query: query,
    p_embedding: emb,
    p_limit: limit,
  });
  if (error) throw error;
  return data || [];
}

export async function upsertMemory(db, { userId, sourceType, sourceId, content, metadata = {} }) {
  const emb = await embedOne(content, { inputType: 'document' });
  const row = {
    user_id: userId,
    source_type: sourceType,
    source_id: sourceId || null,
    content,
    metadata,
    embedding: emb,
  };
  if (sourceId) {
    await db.from('memories').delete().match({ source_type: sourceType, source_id: sourceId });
  }
  const { data, error } = await db.from('memories').insert(row).select().single();
  if (error) throw error;
  return data;
}

export function formatCitations(results) {
  return results.map((r, i) => `[${i + 1}] (${r.source_type}) ${r.content.slice(0, 240)}`).join('\n');
}

export { EMBED_DIM };
