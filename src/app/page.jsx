import { getSupabaseServerClient } from '@/lib/supabase/server-utils'
import { redirect } from 'next/navigation'
import AnimatedInis from './AnimatedInis'
import LocationUpdater from './LocationUpdater'
import { calculateInisStats } from '@/lib/inis/stats';

export default async function Home() {
  const supabase = getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userCharacters } = await supabase
    .from('user_characters')
    .select(`
      id,
      characters (
        image_url,
        level,
        attack_stat,
        defense_stat,
        health_stat,
        recovery_stat,
        affection
      )
    `)
    .eq('user_id', user.id)

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
        <span>{user.email}</span>
        <form action="/auth/signout" method="post" style={{ display: 'inline', marginLeft: '10px' }}>
          <button type="submit">로그아웃</button>
        </form>
      </div>

      <h1>My Inis</h1>
      <p>내가 보유한 캐릭터 목록</p>
      
      <div style={{ marginTop: '30px', minHeight: '250px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {userCharacters && userCharacters.length > 0 ? (
          userCharacters.map(uc => (
            <div key={uc.id}>
              <AnimatedInis imageUrl={uc.characters.image_url} />
              {uc.characters && (
                <>
                  {(() => {
                    const calculatedStats = calculateInisStats({
                      level: uc.characters.level,
                      attack_stat: uc.characters.attack_stat,
                      defense_stat: uc.characters.defense_stat,
                      health_stat: uc.characters.health_stat,
                      recovery_stat: uc.characters.recovery_stat,
                      affection: uc.characters.affection,
                    });
                    return (
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        <p>레벨: {uc.characters.level}</p>
                        <p>공격력: {calculatedStats.attack_power}</p>
                        <p>방어력: {calculatedStats.defense_power}</p>
                        <p>체력: {calculatedStats.max_health}</p>
                        <p>회복력: {calculatedStats.recovery_power}</p>
                        <p>유대감: {uc.characters.affection}</p>
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

      <LocationUpdater />

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