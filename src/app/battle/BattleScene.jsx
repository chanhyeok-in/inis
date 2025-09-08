'use client'

import { useState, useEffect } from 'react'
import { default as NextImage } from 'next/image'

// Helper for action icons
function ActionIcon({ action, actor }) {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50px',
    height: '50px',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  }

  let iconSrc = null
  if (action === 'understand') iconSrc = '/question.svg'
  if (action === 'space_out') iconSrc = '/ellipsis.svg'
  if (action === 'not_listen') iconSrc = '/cross.svg'

  if (!iconSrc) return null

  return <NextImage src={iconSrc} alt={action} width={50} height={50} style={style} />
}

export default function BattleScene({ battleData }) {
  const { userChar, opponentChar, battleLog, didWin, affectionIncreased } = battleData
  const [logIndex, setLogIndex] = useState(0)
  const [animation, setAnimation] = useState({ active: false, type: null, actor: null })
  const [health, setHealth] = useState({ user: battleLog[0].userHealth, opponent: battleLog[0].opponentHealth })

  const currentLogEntry = battleLog[logIndex]
  const isBattleOver = currentLogEntry.type === 'end';

  useEffect(() => {
    const entry = battleLog[logIndex]
    if (entry.type === 'action') {
      setAnimation({ active: true, type: entry.action, actor: entry.actor })

      const animationTime = 1500 // ms
      setTimeout(() => {
        setHealth({ user: entry.userHealth, opponent: entry.opponentHealth })
        setAnimation({ active: false, type: null, actor: null })
      }, animationTime)
    } else {
      // For 'start', 'recovery', 'end' types
      setHealth({ user: entry.userHealth, opponent: entry.opponentHealth })
    }
  }, [logIndex, battleLog])

  const handleNext = () => {
    if (logIndex < battleLog.length - 1 && !animation.active) {
      setLogIndex(logIndex + 1)
    }
  }

  const getInisStyle = (character) => {
    const isActor = animation.active && animation.actor === character
    const style = {
      transition: 'transform 0.5s ease-in-out',
      transform: 'translateX(0)',
    }
    if (isActor && animation.type === 'attack') {
      style.transform = character === 'user' ? 'translateX(180px)' : 'translateX(-180px)'
    }
    return style
  }

  const getIconStyle = (character) => {
    const isActor = animation.active && animation.actor === character
    const style = {
      position: 'absolute',
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '50px',
      height: '50px',
      opacity: 0,
      transition: 'opacity 0.3s ease-in-out',
    }
    if (isActor && ['understand', 'space_out', 'not_listen'].includes(animation.type)) {
      style.opacity = 1
      if (animation.type === 'understand') {
        style.animation = 'shake 0.5s linear infinite'
      }
    }
    return style
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(-55%, 5%) rotate(-15deg); }
          50% { transform: translate(-45%, -5%) rotate(15deg); }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px', border: '1px solid #333', borderRadius: '10px', background: '#f9f9f9', overflow: 'hidden' }}>
        {/* User Inis */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h2>내 이니스</h2>
          <div style={getInisStyle('user')}>
            <NextImage src={userChar.image_url} alt="My Inis" width={150} height={150} style={{ border: '2px solid blue', borderRadius: '8px' }} />
          </div>
          <div style={getIconStyle('user')}>
            <ActionIcon action={animation.type} />
          </div>
          <p>체력: {health.user} / {battleLog[0].userHealth}</p>
        </div>

        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>VS</div>

        {/* Opponent Inis */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h2>{opponentChar.name}</h2>
          <div style={getInisStyle('opponent')}>
            <NextImage src={opponentChar.image_url} alt="Opponent Inis" width={150} height={150} style={{ border: '2px solid red', borderRadius: '8px' }} />
          </div>
           <div style={getIconStyle('opponent')}>
            <ActionIcon action={animation.type} />
          </div>
          <p>체력: {health.opponent} / {battleLog[0].opponentHealth}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', minHeight: '100px', background: '#fff' }}>
        <p style={{ color: 'black', whiteSpace: 'pre-wrap', textAlign: 'center', fontWeight: 'bold' }}>{currentLogEntry.message}</p>
      </div>

      {!isBattleOver ? (
        <button onClick={handleNext} disabled={animation.active} style={{ marginTop: '10px', padding: '10px 20px', cursor: animation.active ? 'not-allowed' : 'pointer' }}>
          {animation.active ? '(액션 진행중...)' : '다음'}
        </button>
      ) : (
        <div style={{ marginTop: '20px', fontWeight: 'bold', color: didWin ? 'green' : 'red', textAlign: 'center' }}>
          <h2>{didWin ? '승리!' : '패배!'}</h2>
          {affectionIncreased && <p>유대감이 1 증가했습니다!</p>}
        </div>
      )}
    </div>
  )
}