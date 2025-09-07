import BattleClientPage from './client-page';
import { getSupabaseServerClient } from '@/lib/supabase/server-utils';

export default async function BattlePageServer() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Handle not logged in, maybe redirect to login
    return <div>로그인되지 않았습니다.</div>;
  }

  // No longer fetching nearbyUsers here by default
  return <BattleClientPage />;
}