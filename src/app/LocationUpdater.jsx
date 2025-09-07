'use client'

import { useState } from 'react'
import { updateLocation } from './actions'

export default function LocationUpdater() {
  const [status, setStatus] = useState('idle') // idle | updating | success | error

  const handleLocationUpdate = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      alert('이 브라우저에서는 위치 정보 기능을 사용할 수 없습니다.')
      return
    }

    setStatus('updating')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await updateLocation(latitude, longitude)
        setStatus('success')
        alert('위치 정보가 성공적으로 업데이트되었습니다!')
      },
      (error) => {
        setStatus('error')
        console.error('Geolocation error:', error)
        alert(`위치 정보를 가져오는 데 실패했습니다: ${error.message}`)
      }
    )
  }

  return (
    <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
      <h4>위치 정보</h4>
      <p style={{ fontSize: '12px', color: '#666' }}>
        주변 사용자와 교배하려면 현재 위치를 업데이트해야 합니다.
      </p>
      <button onClick={handleLocationUpdate} disabled={status === 'updating'}>
        {status === 'updating' ? '업데이트 중...' : '내 위치 업데이트하기'}
      </button>
    </div>
  )
}
