'use client'

import { useActionState, useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { performBattle } from '../daily-actions'
import Link from 'next/link'
import BattleScene from './BattleScene'
import { createClient } from '@/lib/supabase/client'

export default function BattlePage() {
  const [state, formAction] = useActionState(performBattle, { success: false, message: '', battleData: null })
  const { pending } = useFormStatus()
  const [battleMode, setBattleMode] = useState('random'); // 'nearby' or 'random'
  const [fetchedNearbyUsers, setFetchedNearbyUsers] = useState(null); // New state for fetched nearby users
  const [locationLoading, setLocationLoading] = useState(false); // New state for location loading

  // Function to fetch nearby users
  const fetchNearbyUsers = async () => {
    setLocationLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Handle not logged in
      setLocationLoading(false);
      return;
    }

    // Fetch current user's location
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('latitude, longitude')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile || !currentUserProfile.latitude || !currentUserProfile.longitude) {
      // Handle case where location is not available for current user
      setFetchedNearbyUsers([]); // Set to empty array if no location
      setLocationLoading(false);
      return;
    }

    // Round latitude and longitude to 2 decimal places
    const roundedLatitude = parseFloat(currentUserProfile.latitude.toFixed(2));
    const roundedLongitude = parseFloat(currentUserProfile.longitude.toFixed(2));

    // Find other users at the same rounded location
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

  // Effect to fetch nearby users when battleMode changes to 'nearby'
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
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => { setBattleMode('nearby'); setFetchedNearbyUsers(null); }} // Reset fetchedNearbyUsers
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: battleMode === 'nearby' ? '#0070f3' : '#ccc',
                color: battleMode === 'nearby' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              근처 이니스와 전투
            </button>
            <button
              onClick={() => setBattleMode('random')}
              style={{
                padding: '10px 20px',
                backgroundColor: battleMode === 'random' ? '#0070f3' : '#ccc',
                color: battleMode === 'random' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              랜덤 이니스와 전투
            </button>
          </div>

          {battleMode === 'nearby' && (
            locationLoading ? (
              <p>위치 정보를 불러오는 중...</p>
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
                            disabled={pending}
                            style={{ marginRight: '10px' }}
                          />
                          {user.email}
                        </label>
                      ))}
                    </div>
                    <button type="submit" aria-disabled={pending} style={{ marginTop: '20px', padding: '10px 20px' }}>
                      {pending ? '전투 준비 중...' : '선택한 이니스와 전투 시작'}
                    </button>
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
                <button type="submit" aria-disabled={pending} style={{ marginTop: '20px', padding: '10px 20px' }}>
                  {pending ? '전투 준비 중...' : '랜덤 이니스와 전투 시작'}
                </button>
              </form>
            </>
          )}

          {state.message && (
            <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
              <p style={{ color: 'red' }}>{state.message}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
