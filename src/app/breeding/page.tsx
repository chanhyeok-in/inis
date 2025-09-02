import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { breedWithCharacter } from './actions'

// This component remains the same
async function BreedButton({ characterId }: { characterId: number }) {
  // The server action needs the ID of the character we are breeding WITH.
  // The ID of our own character isn't needed for the action itself.
  const action = breedWithCharacter.bind(null, characterId)

  return (
    <form action={action}>
      <button type="submit" style={{ marginTop: '5px', width: '100%' }}>
        교배하기
      </button>
    </form>
  )
}

export default async function BreedingPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Get current user's location
  const { data: profile } = await supabase
    .from('profiles')
    .select('latitude, longitude')
    .eq('id', user.id)
    .single()

  let nearbyCharacters: { character_id: bigint; image_url: string }[] | null = []

  // 2. If location exists, call the RPC to get nearby characters
  if (profile && profile.latitude && profile.longitude) {
    const { data, error } = await supabase.rpc('get_nearby_characters', {
      current_user_id: user.id,
      user_latitude: profile.latitude,
      user_longitude: profile.longitude,
    })
    if (error) {
      console.error('Error fetching nearby characters:', error)
    } else {
      nearbyCharacters = data
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <Link href="/" style={{ textDecoration: 'underline' }}>&larr; 홈으로 돌아가기</Link>
      <h1 style={{ textAlign: 'center', marginTop: '10px' }}>교배 상대 선택</h1>
      <p style={{ textAlign: 'center' }}>다른 사용자의 캐릭터와 교배하여 새로운 캐릭터를 얻어보세요. (하루 1회)</p>

      {/* 3. Render based on location and character availability */}
      {(!profile?.latitude || !profile.longitude) ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p>주변 캐릭터를 찾으려면 먼저 위치 정보를 업데이트해야 합니다.</p>
          <Link href="/" style={{ textDecoration: 'underline' }}>홈으로 이동하여 위치를 업데이트하세요.</Link>
        </div>
      ) : nearbyCharacters && nearbyCharacters.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '30px' }}>
          {nearbyCharacters.map((character) => (
            <div key={character.character_id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <Image
                src={character.image_url}
                alt="Another user's character"
                width={150}
                height={150}
              />
              {/* The character ID from the RPC result is a bigint, convert to number */}
              <BreedButton characterId={Number(character.character_id)} />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', marginTop: '50px' }}>주변에 교배할 다른 캐릭터가 없습니다. 다른 지역에서 새로운 친구를 찾아보세요!</p>
      )}
    </div>
  )
}
