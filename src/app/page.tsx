import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import LocationUpdater from './LocationUpdater'

export default async function Home() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's character(s)
  const { data: userCharacters } = await supabase
    .from('user_characters')
    .select(`
      id,
      characters (
        image_url
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

      <h1>나의 다마고치</h1>
      <p>내가 보유한 캐릭터 목록</p>
      
      <div style={{ marginTop: '30px', minHeight: '250px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {userCharacters && userCharacters.length > 0 ? (
          userCharacters.map(uc => (
            <div key={uc.id}>
              <Image
                src={uc.characters.image_url}
                alt="My Character"
                width={150}
                height={150}
                priority
                style={{ border: '1px solid #ccc', borderRadius: '8px' }}
              />
            </div>
          ))
        ) : (
          <div style={{ border: '1px dashed #ccc', borderRadius: '8px', height: '150px', width: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
            <p style={{ fontSize: '12px' }}>아직 지급된 캐릭터가 없습니다.<br/>(데이터베이스 트리거가 설정된 이후에<br/>새로 가입한 계정으로 확인해주세요)</p>
          </div>
        )}
      </div>

      <LocationUpdater />

      <div style={{ marginTop: '20px' }}>
        <a href="/breeding" style={{ padding: '10px 20px', background: '#0070f3', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
          교배하러 가기
        </a>
      </div>
    </div>
  )
}
