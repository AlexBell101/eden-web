import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * ONLY use inside server actions / API routes after verifying the user.
 * Never expose this to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
