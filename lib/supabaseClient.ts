import { createClient } from '@supabase/supabase-js';

/**
 * Credentials come from the environment. They used to be hardcoded as fallbacks in
 * this file, which committed them to source control — rotate that old key.
 * Copy `.env.example` to `.env.local` and fill it in.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Copy .env.example to .env.local and set ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/** Browser + general-purpose client. Subject to Row Level Security. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-only client for route handlers.
 *
 * Uses the service-role key when one is configured, which lets you lock RLS down so
 * the browser cannot write to `reviews` directly and every insert must pass the
 * validation in `/api/reviews`. Without it, this is just the anon client and the
 * database policies are your only guard — see `supabase/schema.sql`.
 *
 * Never import this from a `'use client'` module.
 */
export function createServerSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return supabase;

  return createClient(supabaseUrl!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
