import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = getSupabaseServerClient()

  // Sign out the user
  await supabase.auth.signOut()

  // Redirect to the login page after signing out
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}
