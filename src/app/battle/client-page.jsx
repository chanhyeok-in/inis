'use client'

import { useActionState, useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { performBattle } from '../daily-actions'
import Link from 'next/link'
import BattleScene from './BattleScene'
import { createClient } from '@/lib/supabase/client'
import StyledButton from '../components/StyledButton'
import LoadingSpinner from '../components/LoadingSpinner'

// A new component to handle the pending state within a form
function SubmitButton({ children, ...props }) {
  const { pending } = useFormStatus()
  return (
    <StyledButton type="submit" disabled={pending} {...props}>
      {pending ? <LoadingSpinner size={20} color="#888" /> : children}
    </StyledButton>
  )
}

export default function BattlePage() {
  const [state, formAction] = useActionState(performBattle, { success: false, message: '', battleData: null })
  const [battleMode, setBattleMode] = useState('random'); // 'nearby' or 'random'
  const [fetchedNearbyUsers, setFetchedNearbyUsers] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchNearbyUsers = async () => {
    setLocationLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLocationLoading(false);
      return;
    }

    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('latitude, longitude')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile || !currentUserProfile.latitude || !currentUserProfile.longitude) {
      setFetchedNearbyUsers([]);
      setLocationLoading(false);
      return;
    }

    const roundedLatitude = parseFloat(currentUserProfile.latitude.toFixed(2));
    const roundedLongitude = parseFloat(currentUserProfile.longitude.toFixed(2));

    const { data: nearbyUsersData, error: nearbyUsersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('latitude', roundedLatitude)
      .eq('longitude', roundedLongitude)
      .neq('id', user.id);

    if (nearbyUsersError) {
      console.error('Error fetching nearby users:', nearbyUsersError);
      setFetchedNearbyUsers([]);
    } else {
      setFetchedNearbyUsers(nearbyUsersData || []);
    }
    setLocationLoading(false);
  };

  useEffect(() => {
    if (battleMode === 'nearby' && fetchedNearbyUsers === null) {
      fetchNearbyUsers();
    }
  }, [battleMode, fetchedNearbyUsers]);


  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Link href="/" style={{ textDecoration: 'underline' }}>&larr; 홈으로 돌아가기</Link>
      <h1 style={{ marginTop: '20px' }}>전투하기</h1>

      {state.battleData ? (
        <BattleScene battleData={state.battleData} />
      ) : (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <StyledButton
              onClick={() => { setBattleMode('nearby'); setFetchedNearbyUsers(null); }}
              disabled={battleMode === 'nearby'}
            >
              근처 이니스와 전투
            </StyledButton>
            <StyledButton
              onClick={() => setBattleMode('random')}
              disabled={battleMode === 'random'}
            >
              랜덤 이니스와 전투
            </StyledButton>
          </div>

          {battleMode === 'nearby' && (
            locationLoading ? (
              <LoadingSpinner />
            ) : (
              fetchedNearbyUsers && fetchedNearbyUsers.length > 0 ? (
                <>
                  <p style={{ marginBottom: '20px' }}>근처에 있는 이니스와 전투하세요:</p>
                  <form action={formAction}>
                    <input type="hidden" name="battleMode" value="nearby" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                      {fetchedNearbyUsers.map(user => (
                        <label key={user.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="opponentId"
                            value={user.id}
                            style={{ marginRight: '10px' }}
                          />
                          {user.email}
                        </label>
                      ))}
                    </div>
                    <SubmitButton style={{ marginTop: '20px' }}>
                      선택한 이니스와 전투 시작
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <p style={{ marginBottom: '20px' }}>근처에 전투할 수 있는 이니스가 없습니다.</p>
              )
            )
          )}

          {battleMode === 'random' && (
            <>
              <p style={{ marginBottom: '20px' }}>랜덤 이니스와 전투를 시작합니다.</p>
              <form action={formAction}>
                <input type="hidden" name="battleMode" value="random" />
                <SubmitButton style={{ marginTop: '20px' }}>
                  랜덤 이니스와 전투 시작
                </SubmitButton>
              </form>
            </>
          )}

          {state.message && !state.success && (
            <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
              <p style={{ color: 'red' }}>{state.message}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}