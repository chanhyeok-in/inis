'use server'

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server-utils'
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

export async function protonLoginAction(actor) {
  if (!actor) {
    return { success: false, error: 'Actor is required.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  // 1. Check if user with this proton_actor already exists
  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, name') // also select name
    .eq('proton_actor', actor)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error finding profile:', profileError);
    return { success: false, error: 'Database error while checking profile.' };
  }

  let userId;
  let userName;
  if (profile) {
    // User exists, get their ID and name
    userId = profile.id;
    userName = profile.name;
  } else {
    // 2. User does not exist, create a new one
    userName = actor; // Default username to actor
    const { data: newUser, error: newUserError } = await supabaseAdmin.auth.admin.createUser({
      email: `${actor}@proton.local`,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
    });

    if (newUserError) {
      console.error('Error creating new user:', newUserError);
      return { success: false, error: 'Could not create a new user.' };
    }

    userId = newUser.user.id;

    // 3. Create a corresponding profile for the new user
    const { error: newProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, proton_actor: actor, name: userName });

    if (newProfileError) {
      console.error('Error creating new profile:', newProfileError);
      await supabaseAdmin.auth.admin.deleteUser(userId); // Clean up created user
      return { success: false, error: 'Could not create a new user profile.' };
    }
  }

  // 4. Generate a magic link for the user to sign in.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: `${actor}@proton.local`,
  });

  if (error) {
    console.error('Error generating magic link:', error);
    return { success: false, error: 'Could not generate sign-in link.' };
  }

  // The client will use this to sign in.
  return { success: true, magicLink: data.properties.action_link };
}

export async function updateProtonActor(actor) {
  if (!actor) {
    return { success: false, error: 'Actor is required.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  // Check if the actor is already linked to another account
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('proton_actor', actor)
    .not('id', 'eq', user.id) // Exclude the current user
    .single();

  if (existingProfileError && existingProfileError.code !== 'PGRST116') {
    console.error('Error checking for existing actor link:', existingProfileError);
    return { success: false, error: 'Database error.' };
  }

  if (existingProfile) {
    return { success: false, error: 'This Proton account is already linked to another user.' };
  }

  // Update the current user's profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ proton_actor: actor })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating proton_actor:', updateError);
    return { success: false, error: 'Failed to link account.' };
  }

  revalidatePath('/'); // Revalidate the home page to show the new state
  return { success: true };
}
