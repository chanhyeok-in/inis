import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { redirect } from 'next/navigation'
import AnimatedInis from './AnimatedInis'
import { calculateInisStats } from '@/lib/inis/stats';
import Link from 'next/link'; // Import Link
import StyledButton from './components/StyledButton'; // Import StyledButton
import { checkAndResetDailyCounts } from './daily-actions'; // Import checkAndResetDailyCounts
import { useState } from 'react'; // Import useState
import BattleHistoryModal from './components/BattleHistoryModal'; // Import BattleHistoryModal

export default async function Home() {
  const [showBattleHistory, setShowBattleHistory] = useState(false); // State for showing battle history modal
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  console.log('User ID:', user?.id); // Log user ID

  if (!user) {
    redirect('/login')
  }

  // Fetch profile counts
  let { data: profile, error: profileError } = await supabase // Use 'let' for profile
    .from('profiles')
    .select('walk_count, conversation_count, battle_count, last_daily_reset') // Add last_daily_reset
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile counts:', profileError);
  }

  if (profile) { // Only proceed if profile was successfully fetched
    await checkAndResetDailyCounts(supabase, user.id, profile);
    // Re-fetch profile to get updated counts after potential reset
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('walk_count, conversation_count, battle_count, last_daily_reset')
      .eq('id', user.id)
      .single();

    if (updatedProfileError) {
      console.error('Error re-fetching profile after reset check:', updatedProfileError);
    } else {
      profile = updatedProfile; // Use the updated profile
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
    .eq('user_id', user.id)

  if (fetchUserCharactersError) {
    console.error('Error fetching user characters:', fetchUserCharactersError); // Log fetch error
  }
  console.log('User Characters:', userCharacters); // Log userCharacters data

  const needsNaming = userCharacters?.some(uc => !uc.name || uc.name.trim() === '');
  if (needsNaming) {
    console.log('Redirecting to /name-inis because Inis needs naming.'); // Log redirect
    redirect('/name-inis');
  }

  return (
    <> {/* Opening fragment tag */}
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
        <span>{user.email}</span>
        <button onClick={() => setShowBattleHistory(true)} style={{ marginLeft: '10px', padding: '8px 12px', border: 'none', borderRadius: '5px', background: '#007bff', color: 'white', cursor: 'pointer' }}>
          전투 기록 보기
        </button>
        <form action="/auth/signout" method="post" style={{ display: 'inline', marginLeft: '10px' }}>
          <button type="submit">로그아웃</button>
        </form>
      </div>

      <h1>내 Inis</h1>
      
      <div style={{ marginTop: '30px', minHeight: '250px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {userCharacters && userCharacters.length > 0 ? (
          userCharacters.map(uc => (
            <div key={uc.id}>
              <AnimatedInis imageUrl={uc.characters.image_url} />
              {uc && (
                <>
                  {(() => {
                    const calculatedStats = calculateInisStats({
                      level: uc.level,
                      attack_stat: uc.attack_stat,
                      defense_stat: uc.defense_stat,
                      health_stat: uc.health_stat,
                      recovery_stat: uc.recovery_stat,
                      affection: uc.affection,
                    });
                    return (
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        <p>이름: {uc.name || '이름 없음'}</p>
                        <p>레벨: {uc.level}</p>
                        <p>공격력: {calculatedStats.attack_power}</p>
                        <p>방어력: {calculatedStats.defense_power}</p>
                        <p>체력: {calculatedStats.max_health}</p>
                        <p>회복력: {calculatedStats.recovery_power}</p>
                        <p>유대감: {uc.affection}</p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ))
        ) : (
          <div style={{ border: '1px dashed #ccc', borderRadius: '8px', height: '150px', width: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
            <p style={{ fontSize: '12px' }}>아직 지급된 캐릭터가 없습니다.<br/>(데이터베이스 트리거가 설정된 이후에<br/>새로 가입한 계정으로 확인해주세요)</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Link href="/walk">
          <StyledButton style={{ backgroundColor: '#4CAF50', color: 'white' }} faded={walkCount >= maxWalk}>
            산책하기 ({walkCount}/{maxWalk})
          </StyledButton>
        </Link>
        <Link href="/conversation">
          <StyledButton style={{ backgroundColor: '#FFC107', color: 'white' }} faded={conversationCount >= maxConversation}>
            대화하기 ({conversationCount}/{maxConversation})
          </StyledButton>
        </Link>
        <Link href="/battle">
          <StyledButton style={{ backgroundColor: '#F44336', color: 'white' }} faded={battleCount >= maxBattle}>
            전투하기 ({battleCount}/{maxBattle})
          </StyledButton>
        </Link>
      </div>
    </div>
    {showBattleHistory && <BattleHistoryModal userId={user.id} onClose={() => setShowBattleHistory(false)} />}
    </> {/* Closing fragment tag */}
  )
}
}
