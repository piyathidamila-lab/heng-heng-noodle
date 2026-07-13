import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------

/**
 * Service-role Supabase client. Bypasses row level security, so it must
 * only ever be imported from server-only code (route handlers, server
 * actions, server components) — never from a client component.
 */

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY environment variables.'
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });

  return client;
}
