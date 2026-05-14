import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export function userClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

let _admin = null;
export function adminClient() {
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
