import { getSupabaseServerClient } from '@/lib/supabase/server-utils';
import { cookies } from 'next/headers';
import BattleClientPage from './client-page';

export default async function BattlePageServer() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Handle not logged in, maybe redirect to login
    return <div>로그인되지 않았습니다.</div>;
  }

  // Fetch current user's location
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('latitude, longitude')
    .eq('id', user.id)
    .single();

  if (profileError || !currentUserProfile || !currentUserProfile.latitude || !currentUserProfile.longitude) {
    // Handle case where location is not available for current user
    return <div>위치 정보를 불러올 수 없습니다.</div>;
  }

  // Find other users at the same location
  const { data: nearbyUsers, error: nearbyUsersError } = await supabase
    .from('profiles')
    .select('id, email') // Select necessary opponent info
    .eq('latitude', currentUserProfile.latitude)
    .eq('longitude', currentUserProfile.longitude)
    .neq('id', user.id);

  if (nearbyUsersError) {
    console.error('Error fetching nearby users:', nearbyUsersError);
    return <div>근처 사용자를 불러오는 데 실패했습니다.</div>;
  }

  return <BattleClientPage nearbyUsers={nearbyUsers || []} />;
}