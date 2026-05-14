import { env, hasLLM } from './env.js';

const API = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

async function call(body, { stream = false } = {}) {
  if (!hasLLM()) throw new Error('ANTHROPIC_API_KEY not configured');
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.anthropicKey,
      'anthropic-version': VERSION,
    },
    body: JSON.stringify({ ...body, stream }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text}`);
  }
  return res;
}

export async function complete({ system, messages, tools, model, maxTokens = 2048, temperature = 0.4 }) {
  const res = await call({
    model: model || env.anthropicModel,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
    tools,
  });
  return res.json();
}

export async function* streamComplete({ system, messages, tools, model, maxTokens = 2048, temperature = 0.4 }) {
  const res = await call(
    {
      model: model || env.anthropicModel,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
      tools,
    },
    { stream: true },
  );

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, i);
      buffer = buffer.slice(i + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') return;
      try {
        yield JSON.parse(payload);
      } catch {
        // ignore non-JSON keepalives
      }
    }
  }
}
