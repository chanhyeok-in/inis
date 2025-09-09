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
      .select('id, username, user_characters(level, characters(image_url))') // Include user_characters data
      .gte('latitude', roundedLatitude - 0.1)
      .lt('latitude', roundedLatitude + 0.1)
      .gte('longitude', roundedLongitude - 0.1)
      .lt('longitude', roundedLongitude + 0.1)
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

      <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9', color: '#333' }}>
        <h4 style={{ marginTop: '0', marginBottom: '10px', color: '#0056b3' }}>전투 시스템 설명</h4>
        <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
          <strong>스탯 성장:</strong> 랜덤 이니스와의 전투에서 승리하거나 무승부 시, 이니스의 스탯(공격력, 방어력, 체력, 회복력 중 하나)이 무작위로 1 증가합니다.
        </p>
        <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
          <strong>유대감의 중요성:</strong> 이니스와의 유대감이 높을수록 전투 시 이니스가 '공격했다!' 행동을 할 확률이 높아지고, '유저의 말을 듣지 않는다!' 행동을 할 확률이 낮아집니다.
        </p>
        <p style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
          <strong>근처 이니스 전투:</strong> 근처 이니스와의 전투는 횟수 제한이 없으며, 스탯이나 유대감 보상이 없습니다. 연습 전투로 활용하세요.
        </p>
      </div>

      {state.battleData ? (
        <BattleScene battleData={state.battleData} />
      ) : (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <StyledButton
              onClick={() => setBattleMode('random')}
              disabled={battleMode === 'random'}
            >
              랜덤 이니스와 전투
            </StyledButton>
            <StyledButton
              onClick={() => { setBattleMode('nearby'); setFetchedNearbyUsers(null); }}
              disabled={battleMode === 'nearby'}
            >
              근처 이니스와 전투
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
                      {fetchedNearbyUsers.map(profile => {
                        const inis = profile.user_characters?.[0]; // Assuming one Inis per user for display
                        if (!inis || !inis.characters) return null; // Skip if no Inis data

                        return (
                          <label key={profile.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="opponentId"
                              value={profile.id}
                              style={{ marginRight: '10px' }}
                            />
                            <img src={inis.characters.image_url} alt="Inis Image" style={{ width: '40px', height: '40px', marginRight: '10px', borderRadius: '50%' }} />
                            <span>{profile.username} (Lv.{inis.level})</span>
                          </label>
                        );
                      })}
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