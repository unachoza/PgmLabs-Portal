import { createClient } from '@supabase/supabase-js';
import { getStoredMockSession, isMockModeEnabled, mockSignIn, mockSignOut, subscribeMockSession } from './mockRuntime';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createMockSupabaseClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: getStoredMockSession() }, error: null };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        return mockSignIn(email, password);
      },
      async signOut() {
        return mockSignOut();
      },
      onAuthStateChange(callback: (event: string, session: ReturnType<typeof getStoredMockSession>) => void) {
        const unsubscribe = subscribeMockSession(callback);
        return { data: { subscription: { unsubscribe } } };
      },
    },
  } as const;
}

// Browser client, anon key only. Used for auth (sign in/out, session) —
// data access goes through /api, never queried directly from the client.
export const supabase = isMockModeEnabled()
  ? createMockSupabaseClient()
  : (() => {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
      }
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
