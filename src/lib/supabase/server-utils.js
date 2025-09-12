import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This client is for general server-side operations, using the user's session.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name) {
          return (await cookieStore.get(name))?.value
        },
        set(name, value, options) {
          // The middleware is responsible for actual cookie setting.
        },
        remove(name, options) {
          // The middleware is responsible for actual cookie setting.
        },
      },
    }
  )
}

// This client is for admin-level operations that require the service_role key.
export function getSupabaseAdminClient() {
  // Note: This client does not use the user's cookie-based session and has full admin rights.
  // Use it with caution.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name) {
          // This client is not meant to read user cookies.
          return undefined;
        },
        set(name, value, options) {
          // This client is not meant to set user cookies.
        },
        remove(name, options) {
          // This client is not meant to remove user cookies.
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
