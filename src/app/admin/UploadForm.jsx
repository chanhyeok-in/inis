'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { uploadCharacter } from './actions'

const initialState = {
  message: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" aria-disabled={pending} style={{ marginTop: '10px' }}>
      {pending ? '업로드 중...' : '캐릭터 생성'}
    </button>
  )
}

export default function UploadForm() {
  const [state, formAction] = useActionState(uploadCharacter, initialState)

  return (
    <form action={formAction} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '10px' }}>
      <div>
        <label htmlFor="image">캐릭터 이미지</label>
        <input type="file" id="image" name="image" accept="image/png, image/jpeg" required style={{ display: 'block' }} />
      </div>
      <div>
        <label htmlFor="traits">특징 (JSON 형식)</label>
        <textarea
          id="traits"
          name="traits"
          rows={4}
          required
          style={{ display: 'block', width: '100%', border: '1px solid #ccc' }}
          placeholder='{"eye_color": "blue", "shape": "round"}'
        />
      </div>
      <SubmitButton />
      {state?.message && <p style={{ color: state.message.startsWith('성공') ? 'green' : 'red' }}>{state.message}</p>}
    </form>
  )
}
