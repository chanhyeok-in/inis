import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { redirect } from 'next/navigation'
import AnimatedInis from './AnimatedInis'
import { calculateInisStats } from '@/lib/inis/stats';

export default async function Home() {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  console.log('User ID:', user?.id); // Log user ID

  if (!user) {
    redirect('/login')
  }

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
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
        <span>{user.email}</span>
        <form action="/auth/signout" method="post" style={{ display: 'inline', marginLeft: '10px' }}>
          <button type="submit">로그아웃</button>
        </form>
      </div>

      <h1>My Inis</h1>
      <p>내가 보유한 Inis</p>
      
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
        <a href="/walk" style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
          산책하기
        </a>
        <a href="/conversation" style={{ padding: '10px 20px', background: '#FFC107', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
          대화하기
        </a>
        <a href="/battle" style={{ padding: '10px 20px', background: '#F44336', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
          전투하기
        </a>
      </div>
    </div>
  )
}
