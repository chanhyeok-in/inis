'use client'

import { useState, useEffect, useActionState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { nameInis } from '../daily-actions'
import { useRouter } from 'next/navigation'
import { default as NextImage } from 'next/image'
import StyledButton from '../components/StyledButton'
import LoadingSpinner from '../components/LoadingSpinner'

export default function NameInisPage() {
  const router = useRouter()
  const [inisToName, setInisToName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [state, formAction] = useActionState(nameInis, { success: false, message: '' })

  useEffect(() => {
    const fetchInisToName = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: userCharacters, error } = await supabase
        .from('user_characters')
        .select(`
          id,
          name,
          characters(image_url)
        `)
        .eq('user_id', user.id)
        .is('name', null) // Find Inis with no name
        .limit(1) // Just take the first one

      if (error) {
        console.error('Error fetching Inis to name:', error)
        setLoading(false)
        return
      }

      if (userCharacters && userCharacters.length > 0) {
        setInisToName(userCharacters[0])
      } else {
        // No Inis needs naming, redirect to home
        router.push('/')
      }
      setLoading(false)
    }

    fetchInisToName()
  }, [router])

  useEffect(() => {
    if (state.success) {
      router.push('/') // Redirect to home after successful naming
    }
  }, [state, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!inisToName) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>이름을 지정할 이니스를 찾을 수 없습니다.</div>
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>이니스 이름 짓기</h1>
      <p>새로운 이니스의 이름을 지어주세요 (최대 10자).</p>

      <div style={{ margin: '20px auto', width: '150px', height: '150px' }}>
        <NextImage src={inisToName.characters.image_url} alt="Your Inis" width={150} height={150} />
      </div>

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', margin: '20px auto', gap: '10px' }}>
        <input type="hidden" name="inisId" value={inisToName.id} />
        <input
          type="text"
          name="inisName"
          maxLength={10}
          required
          placeholder="이니스 이름"
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <StyledButton type="submit">
          이름 저장
        </StyledButton>
      </form>

      {state?.message && <p style={{ color: state.message.startsWith('성공') ? 'green' : 'red' }}>{state.message}</p>}
    </div>
  )
}
