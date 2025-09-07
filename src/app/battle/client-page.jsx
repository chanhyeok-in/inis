'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { performBattle } from '../daily-actions'
import Link from 'next/link'
import BattleScene from './BattleScene'

export default function BattlePage({ nearbyUsers }) {
  const [state, formAction] = useActionState(performBattle, { success: false, message: '', battleData: null })
  const { pending } = useFormStatus()
  const [battleMode, setBattleMode] = useState('nearby'); // 'nearby' or 'random'

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
              onClick={() => setBattleMode('nearby')}
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
            nearbyUsers && nearbyUsers.length > 0 ? (
              <>
                <p style={{ marginBottom: '20px' }}>근처에 있는 이니스와 전투하세요:</p>
                <form action={formAction}>
                  <input type="hidden" name="battleMode" value="nearby" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                    {nearbyUsers.map(user => (
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