import 'dotenv/config';

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: req('SUPABASE_URL'),
  supabaseAnonKey: req('SUPABASE_ANON_KEY'),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-4-7',
  voyageKey: process.env.VOYAGE_API_KEY || '',
  voyageModel: process.env.VOYAGE_MODEL || 'voyage-3',
  cronSecret: process.env.CRON_SECRET || '',
  port: parseInt(process.env.PORT || '3000', 10),
};

export function hasLLM() { return !!env.anthropicKey; }
export function hasEmbeddings() { return !!env.voyageKey; }
