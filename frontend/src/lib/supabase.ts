import { createClient } from "@supabase/supabase-js";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && supabaseKey,
);
export const supabase = configured
  ? createClient(import.meta.env.VITE_SUPABASE_URL, supabaseKey)
  : null;
export function authClient() {
  if (!supabase) throw new Error("Chưa cấu hình kết nối Supabase.");
  return supabase;
}
