'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { performBattle } from '../daily-actions'
import Link from 'next/link'
import BattleScene from './BattleScene'

export default function BattlePage() {
  const [state, formAction] = useActionState(performBattle, { success: false, message: '', battleData: null })
  const { pending } = useFormStatus()

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Link href="/" style={{ textDecoration: 'underline' }}>&larr; 홈으로 돌아가기</Link>
      <h1 style={{ marginTop: '20px' }}>전투하기</h1>

      {state.battleData ? (
        <BattleScene battleData={state.battleData} />
      ) : (
        <>
          <p style={{ marginBottom: '20px' }}>다른 이니스와 전투하여 실력을 겨뤄보세요. (하루 1회)</p>
          <form action={formAction}>
            <button type="submit" aria-disabled={pending}>
              {pending ? '전투 준비 중...' : '전투 시작'}
            </button>
          </form>
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