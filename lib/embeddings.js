import { env, hasEmbeddings } from './env.js';

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';
const DIM = 1024;

export async function embed(texts, { inputType = 'document' } = {}) {
  if (!hasEmbeddings()) {
    return texts.map(() => null);
  }
  const arr = Array.isArray(texts) ? texts : [texts];
  if (arr.length === 0) return [];
  const res = await fetch(VOYAGE_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${env.voyageKey}`,
    },
    body: JSON.stringify({
      model: env.voyageModel,
      input: arr,
      input_type: inputType,
      output_dimension: DIM,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

export async function embedOne(text, opts) {
  const [e] = await embed([text], opts);
  return e;
}

export const EMBED_DIM = DIM;
