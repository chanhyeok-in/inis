'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateLocation(latitude, longitude) {
  const cookieStore = cookies()
  const supabase = getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('User not found for location update')
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({ latitude, longitude })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating location:', error)
    return
  }

  // Revalidate paths that might show location data
  revalidatePath('/')
  
}
