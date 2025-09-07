'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { performConversation } from '../daily-actions'
import Link from 'next/link'
import { default as NextImage } from 'next/image'

export default function ConversationPage() {
  const [state, formAction] = useActionState(performConversation, { success: false, message: '' })
  const { pending } = useFormStatus()
  const formRef = useRef(null)

  useEffect(() => {
    if (state.success || state.message) {
      // Display message in the UI
      if (formRef.current) {
        formRef.current.reset() // Reset form after action
      }
    }
  }, [state])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Link href="/" style={{ textDecoration: 'underline' }}>&larr; 홈으로 돌아가기</Link>
      <h1 style={{ marginTop: '20px' }}>대화하기</h1>
      <p style={{ marginBottom: '20px' }}>이니스와 대화하며 유대감을 쌓아보세요. (하루 3회)</p>

      <div style={{ margin: '20px 0' }}>
        <NextImage src="/conversation.svg" alt="Conversation" width={100} height={100} style={{ display: 'inline-block' }} />
      </div>

      <form action={formAction} ref={formRef}>
        <button type="submit" aria-disabled={pending}>
          {pending ? '대화 중...' : '대화 시작'}
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
