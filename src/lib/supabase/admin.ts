import { createClient } from '@supabase/supabase-js'

// This client uses the service role key, which bypasses Row Level Security (RLS).
// NEVER use this client in the browser or to execute user-provided queries directly.
// It should only be used in secure server environments like webhooks or background jobs.

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn("Supabase Admin Client: Missing URL or Service Role Key in environment variables.")
  }

  return createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
