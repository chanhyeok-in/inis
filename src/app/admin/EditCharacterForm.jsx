'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateCharacter } from './actions' // We will create this action next

const initialState = {
  message: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" aria-disabled={pending} style={{ marginTop: '10px' }}>
      {pending ? '저장 중...' : '변경 사항 저장'}
    </button>
  )
}

export default function EditCharacterForm({ character, onCancel }) {
  const [state, formAction] = useActionState(updateCharacter, initialState)

  return (
    <form action={formAction} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '10px' }}>
      <input type="hidden" name="id" value={character.id} />
      <div>
        <label htmlFor="image_url">이미지 URL</label>
        <input type="text" id="image_url" name="image_url" defaultValue={character.image_url} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      <div>
        <label htmlFor="traits">특징 (JSON 형식)</label>
        <textarea
          id="traits"
          name="traits"
          rows={4}
          required
          defaultValue={JSON.stringify(character.traits, null, 2)}
          style={{ display: 'block', width: '100%', border: '1px solid #ccc' }}
        />
      </div>

      <div>
        <label htmlFor="level">레벨</label>
        <input type="number" id="level" name="level" defaultValue={character.level} min={1} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      <div>
        <label htmlFor="attack_stat">공격력</label>
        <input type="number" id="attack_stat" name="attack_stat" defaultValue={character.attack_stat} min={0} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      <div>
        <label htmlFor="defense_stat">방어력</label>
        <input type="number" id="defense_stat" name="defense_stat" defaultValue={character.defense_stat} min={0} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      <div>
        <label htmlFor="health_stat">체력</label>
        <input type="number" id="health_stat" name="health_stat" defaultValue={character.health_stat} min={0} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      <div>
        <label htmlFor="recovery_stat">회복력</label>
        <input type="number" id="recovery_stat" name="recovery_stat" defaultValue={character.recovery_stat} min={0} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      <div>
        <label htmlFor="affection">유대감</label>
        <input type="number" id="affection" name="affection" defaultValue={character.affection} min={0} required style={{ display: 'block', width: '100%', border: '1px solid #ccc' }} />
      </div>
      
      <SubmitButton />
      <button type="button" onClick={onCancel} style={{ marginTop: '10px', background: '#ccc', color: 'black' }}>취소</button>
      {state?.message && <p style={{ color: state.message.startsWith('성공') ? 'green' : 'red' }}>{state.message}</p>}
    </form>
  )
}
