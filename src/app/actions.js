'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateLocation(latitude, longitude) {
  const cookieStore = cookies()
  const supabase = await getSupabaseServerClient()

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

// New server action to update user language
export async function updateUserLanguage(language) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not found for language update');
    return { success: false, message: 'User not found' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ language })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating user language:', error);
    return { success: false, message: 'Failed to update language' };
  }

  revalidatePath('/'); // Revalidate main page to reflect language change
  return { success: true, message: 'Language updated successfully' };
}