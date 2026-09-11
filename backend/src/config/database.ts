import { createClient } from '@supabase/supabase-js';
import { loadEnvironment } from './env.js';
import type { Database } from '../models/database.types.js';
export const env = loadEnvironment();
export const db = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
