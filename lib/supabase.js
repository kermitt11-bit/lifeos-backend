import { createClient } from '@supabase/supabase-js';
import { env, isDemoMode } from './env.js';
import { MemClient } from './memstore.js';

export function userClient(accessTokenOrUserId) {
  if (isDemoMode()) return new MemClient(accessTokenOrUserId);
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessTokenOrUserId}` } },
  });
}

let _admin = null;
export function adminClient() {
  if (isDemoMode()) return new MemClient('__admin__');
  if (!env.supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for admin operations');
  }
  if (!_admin) {
    _admin = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
