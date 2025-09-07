'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function BattleScene({ battleData }) {
  const { userChar, opponentChar, battleLog, didWin, affectionIncreased } = battleData
  const [logIndex, setLogIndex] = useState(0)

  const handleNext = () => {
    if (logIndex < battleLog.length - 1) {
      setLogIndex(logIndex + 1)
    }
  }

  const currentLogEntry = battleLog[logIndex];
  const isBattleOver = logIndex >= battleLog.length - 1;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px', border: '1px solid #333', borderRadius: '10px', background: '#f9f9f9' }}>
        <div>
          <h2>내 이니스</h2>
          <Image src={userChar.image_url} alt="My Inis" width={150} height={150} style={{ border: '2px solid blue', borderRadius: '8px' }} />
          <p>체력: {currentLogEntry.userHealth}</p>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>VS</div>
        <div>
          <h2>상대 이니스</h2>
          <Image src={opponentChar.image_url} alt="Opponent Inis" width={150} height={150} style={{ border: '2px solid red', borderRadius: '8px' }} />
          <p>체력: {currentLogEntry.opponentHealth}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', minHeight: '100px', background: '#fff' }}>
        <p style={{ fontStyle: 'italic' }}>{currentLogEntry.message}</p>
      </div>

      {!isBattleOver ? (
        <button onClick={handleNext} style={{ marginTop: '10px', padding: '10px 20px' }}>
          다음
        </button>
      ) : (
        <div style={{ marginTop: '20px', fontWeight: 'bold', color: didWin ? 'green' : 'red' }}>
          <h2>{didWin ? '승리!' : '패배!'}</h2>
          {affectionIncreased && <p>유대감이 1 증가했습니다!</p>}
        </div>
      )}
    </div>
  )
}
