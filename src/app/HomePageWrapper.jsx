import { getSupabaseServerClient } from '@/lib/supabase/server-utils';
import { redirect } from 'next/navigation';
import HomePageClient from './HomePageClient';
import { checkAndResetDailyCounts } from './daily-actions';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';

export default async function HomePageWrapper() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile, including proton_actor
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('walk_count, conversation_count, battle_count, last_daily_reset, ranked_win, ranked_draw, ranked_lose, normal_win, normal_draw, normal_lose, language, country, proton_actor')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  // Check and reset daily counts if necessary. 
  // The revalidatePath inside the action will handle refreshing the data.
  if (profile) {
    await checkAndResetDailyCounts(supabase, user.id, profile);
    
    // Re-fetch profile data after potential reset to ensure UI is up-to-date
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('walk_count, conversation_count, battle_count, last_daily_reset, ranked_win, ranked_draw, ranked_lose, normal_win, normal_draw, normal_lose, language, country, proton_actor')
      .eq('id', user.id)
      .single();

    if (updatedProfileError) {
      console.error('Error re-fetching profile after reset check:', updatedProfileError);
    } else {
      profile = updatedProfile;
    }
  }

  const walkCount = profile?.walk_count ?? 0;
  const conversationCount = profile?.conversation_count ?? 0;
  const battleCount = profile?.battle_count ?? 0;

  const maxWalk = 1;
  const maxConversation = 3;
  const maxBattle = 1;

  const { data: userCharacters, error: fetchUserCharactersError } = await supabase
    .from('user_characters')
    .select(`
      id,
      name,
      level,
      attack_stat,
      defense_stat,
      health_stat,
      recovery_stat,
      affection,
      characters (
        image_url
      )
    `)
    .eq('user_id', user.id);

  if (fetchUserCharactersError) {
    console.error('Error fetching user characters:', fetchUserCharactersError);
  }

  const needsNaming = userCharacters?.some(uc => !uc.name || uc.name.trim() === '');
  if (needsNaming) {
    redirect('/name-inis');
  }

  return (
    <LanguageProvider initialLanguage={profile?.language || 'en'}>
      <HomePageClient
        user={user}
        profile={profile}
        walkCount={walkCount}
        conversationCount={conversationCount}
        battleCount={battleCount}
        maxWalk={maxWalk}
        maxConversation={maxConversation}
        maxBattle={maxBattle}
        userCharacters={userCharacters}
      />
    </LanguageProvider>
  );
}
