import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
}

// Browser client, anon key only. Used for auth (sign in/out, session) —
// data access goes through /api, never queried directly from the client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
