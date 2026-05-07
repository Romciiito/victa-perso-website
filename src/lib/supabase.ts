import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY. ' +
      'Server-side writes (forms, booking webhook) cannot proceed without them. ' +
      'See architecture.md AR-21 + docs/setup/vendor-setup-checklist.md §8.',
  );
}

export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Service': 'victa-vercel-fn' } },
});
