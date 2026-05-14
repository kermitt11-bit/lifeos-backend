import 'dotenv/config';

function opt(name, fallback = '') {
  return process.env[name] || fallback;
}

const demoMode = process.env.DEMO_MODE === '1' || !process.env.SUPABASE_URL;

export const env = {
  demoMode,
  supabaseUrl: opt('SUPABASE_URL'),
  supabaseAnonKey: opt('SUPABASE_ANON_KEY'),
  supabaseServiceKey: opt('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseJwtSecret: opt('SUPABASE_JWT_SECRET'),
  anthropicKey: opt('ANTHROPIC_API_KEY'),
  anthropicModel: opt('ANTHROPIC_MODEL', 'claude-opus-4-7'),
  voyageKey: opt('VOYAGE_API_KEY'),
  voyageModel: opt('VOYAGE_MODEL', 'voyage-3'),
  cronSecret: opt('CRON_SECRET'),
  port: parseInt(opt('PORT', '3000'), 10),
};

export function hasLLM()        { return !!env.anthropicKey; }
export function hasEmbeddings() { return !!env.voyageKey; }
export function isDemoMode()    { return env.demoMode; }
