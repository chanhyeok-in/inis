import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
          // This is a no-op to prevent issues in Server Components.
          // The middleware is responsible for actual cookie setting.
        },
        remove(name, options) {
          // This is a no-op.
        },
      },
    }
  )
}
