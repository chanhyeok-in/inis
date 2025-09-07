'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { performWalk } from '../daily-actions'
import Link from 'next/link'
import { default as NextImage } from 'next/image'

export default function WalkPage() {
  const [state, formAction] = useActionState(performWalk, { success: false, message: '' })
  const { pending } = useFormStatus()
  const formRef = useRef(null)

  useEffect(() => {
    if (state.success || state.message) {
      // Display message in the UI, not alert
      // For now, we'll just update the state and display it below
      if (formRef.current) {
        formRef.current.reset() // Reset form after action
      }
    }
  }, [state])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Link href="/" style={{ textDecoration: 'underline' }}>&larr; 홈으로 돌아가기</Link>
      <h1 style={{ marginTop: '20px' }}>산책하기</h1>
      <p style={{ marginBottom: '20px' }}>이니스와 함께 산책하며 유대감을 쌓아보세요. (하루 1회)</p>

      <div style={{ margin: '20px 0' }}>
        <NextImage src="/walk.svg" alt="Walking" width={100} height={100} style={{ display: 'inline-block' }} />
      </div>

      <form action={formAction} ref={formRef}>
        <button type="submit" aria-disabled={pending}>
          {pending ? '산책 중...' : '산책 시작'}
        </button>
      </form>

      {state.message && (
        <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
          <p style={{ color: state.success ? 'green' : 'red', whiteSpace: 'pre-wrap' }}>{state.message}</p>
        </div>
      )}
    </div>
  )
}
