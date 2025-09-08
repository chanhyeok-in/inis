'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { performConversation } from '../daily-actions'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import TalkingInis from './TalkingInis'

export default function ConversationPage() {
  const [state, formAction] = useActionState(performConversation, { success: false, message: '' })
  const { pending } = useFormStatus()
  const formRef = useRef(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [characterId, setCharacterId] = useState(null) // New state for characterId

  useEffect(() => {
    const fetchCharacterImage = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userCharacter } = await supabase
          .from('user_characters')
          .select(`
            characters(image_url),
            id,
            character_id,
            level,
            attack_stat,
            defense_stat,
            health_stat,
            recovery_stat,
            affection
          `)
          .eq('user_id', user.id)
          .single() // Assuming one main character per user for now, or need to select which one
        
        if (userCharacter && userCharacter.characters) {
          setImageUrl(userCharacter.characters.image_url)
          setCharacterId(userCharacter.character_id) // Set characterId
        }
      }
    }

    fetchCharacterImage()
  }, [])

  useEffect(() => {
    if (state.success || state.message) {
      if (formRef.current) {
        formRef.current.reset()
      }
    }
  }, [state])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Link href="/" style={{ textDecoration: 'underline' }}>&larr; 홈으로 돌아가기</Link>
      <h1 style={{ marginTop: '20px' }}>대화하기</h1>
      <p style={{ marginBottom: '20px' }}>이니스와 대화하며 유대감을 쌓아보세요. (하루 3회)</p>

      <div style={{ margin: '20px auto', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {imageUrl ? (
          <TalkingInis imageUrl={imageUrl} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: '8px' }}>
            <p>로딩 중...</p>
          </div>
        )}
      </div>

      <form action={formAction} ref={formRef}>
        {characterId && <input type="hidden" name="characterId" value={characterId} />} {/* Hidden input */}
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
