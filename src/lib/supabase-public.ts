import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------

/**
 * Anon/publishable-key Supabase client for public, read-only access (the
 * customer facing menu). Row level security only grants this key SELECT
 * on menu_items. Only ever imported from server components/actions —
 * never bundled for the browser — so it reads the server-only env names.
 */

let client: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });

  return client;
}
