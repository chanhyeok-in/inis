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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('proton_actor', actor)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('RAW DB ERROR:', profileError);
    return { success: false, error: `Database Error: ${profileError.message}` };
  }

  let emailForMagicLink;
  if (profile) {
    const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (getUserError) {
      console.error('Error fetching user from auth:', getUserError);
      return { success: false, error: 'Could not find user auth details.' };
    }
    emailForMagicLink = authUser.user.email;
  } else {
    emailForMagicLink = `${actor}@proton.local`;
    const userName = actor;
    const { data: newUser, error: newUserError } = await supabaseAdmin.auth.admin.createUser({
      email: emailForMagicLink,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
    });

    if (newUserError) {
      console.error('Error creating new user:', newUserError);
      return { success: false, error: 'Could not create a new user.' };
    }

    const { error: newProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUser.user.id, proton_actor: actor, username: userName });

    if (newProfileError) {
      console.error('Error creating new profile:', newProfileError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return { success: false, error: 'Could not create a new user profile.' };
    }
  }

  // Determine the redirect URL based on the environment
  const redirectTo = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3003/auth/callback' 
    : 'https://inis-iota.vercel.app/auth/callback';

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: emailForMagicLink,
    options: { redirectTo }
  });

  if (error) {
    console.error('Magic link generation failed:', error);
    return { success: false, error: `Magic Link Error: ${error.message}` };
  }

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

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('proton_actor', actor)
    .not('id', 'eq', user.id)
    .single();

  if (existingProfileError && existingProfileError.code !== 'PGRST116') {
    console.error('Error checking for existing actor link:', existingProfileError);
    return { success: false, error: 'Database error.' };
  }

  if (existingProfile) {
    return { success: false, error: 'This Proton account is already linked to another user.' };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ proton_actor: actor })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating proton_actor:', updateError);
    return { success: false, error: 'Failed to link account.' };
  }

  revalidatePath('/');
  return { success: true };
}
