'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function breedWithCharacter(partnerCharacterId: number) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // This should not happen if page is protected, but as a safeguard
    throw new Error('User not found')
  }

  // 1. Cooldown Check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('last_bred_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Could not find user profile.')
  }

  if (profile.last_bred_at) {
    const lastBred = new Date(profile.last_bred_at)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (lastBred > twentyFourHoursAgo) {
      // It has not been 24 hours yet. We can redirect with an error message in a real app.
      // For now, we just stop execution.
      console.log('Breeding cooldown: not yet 24 hours.')
      return // Or redirect with an error query param
    }
  }

  // 2. Breeding Simulation: Get a new random 1st gen character
  const { data: newCharacter, error: newCharError } = await supabase
    .from('characters')
    .select('id')
    .eq('generation', 1)
    .order('id', { ascending: false }) // A simple way to get different characters, not truly random
    .limit(1)
    .single()

  if (newCharError || !newCharacter) {
    throw new Error('Could not find a new character to assign.')
  }

  // 3. Database Updates
  // Add the new character to the user's collection
  const { error: addUserCharError } = await supabase.from('user_characters').insert([
    { user_id: user.id, character_id: newCharacter.id },
  ])

  if (addUserCharError) {
    throw new Error('Failed to assign the new character.')
  }

  // Update the last_bred_at timestamp
  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({ last_bred_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateProfileError) {
    throw new Error('Failed to update breeding timestamp.')
  }

  // 4. Revalidate and Redirect
  revalidatePath('/') // Update the home page to show the new character
  revalidatePath('/breeding') // Update the breeding page (e.g., to show cooldown state)
  redirect('/')
}
