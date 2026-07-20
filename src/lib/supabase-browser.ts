import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------

/**
 * Anon-key Supabase client for the browser. Only used for Realtime
 * subscriptions (order board sync) — actual data reads/writes still go
 * through cookie-gated server actions, so row level security keeps
 * applying and no PII ever needs to travel over this connection.
 */

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });

  return client;
}
