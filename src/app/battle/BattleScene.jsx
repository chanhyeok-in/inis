'use client'

import { useState, useEffect } from 'react'
import { default as NextImage } from 'next/image'
import StyledButton from '../components/StyledButton'
import { useLanguage } from '@/lib/i18n/LanguageProvider';

// Helper for action icons
function ActionIcon({ action }) {
  let content = null;
  let style = {};

  if (action === 'understand') {
    content = '?';
    style = { fontSize: '80px', color: 'white', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }; // Larger, white, bold question mark
  } else if (action === 'space_out') {
    content = <NextImage src="/ellipsis.svg" alt={action} width={80} height={80} style={{ filter: 'invert(100%)' }} />;
  } else if (action === 'not_listen') {
    content = <NextImage src="/cross.svg" alt={action} width={80} height={80} style={{ filter: 'invert(100%)' }} />;
  }

  if (!content) return null;

  return <div style={style}>{content}</div>;
}

// Helper for character display
function CharacterDisplay({ character, health, maxHealth, isUser }) {
  const { t } = useLanguage();
  const borderColor = isUser ? 'blue' : 'red';
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '4px' }}>{character.name || t('common.noName')}</h2>
      <p style={{ fontSize: '0.9em', color: '#ededed', margin: '0' }}>Lv. {character.level}</p>
      <p style={{ fontSize: '0.8em', color: '#bbb', margin: '0 0 8px 0' }}>({character.username})</p>
      <NextImage src={character.image_url} alt={character.name} width={150} height={150} style={{ border: `3px solid ${borderColor}`, borderRadius: '8px' }} />
      <p style={{ color: '#ededed', fontWeight: 'bold', marginTop: '8px' }}>{t('common.healthStatus', { currentHealth: health, maxHealth: maxHealth })}</p>
    </div>
  )
}

export default function BattleScene({ battleData }) {
  const { t } = useLanguage();
  const { userChar, opponentChar, battleLog, didWin, affectionIncreased } = battleData
  const [logIndex, setLogIndex] = useState(0)
  const [animation, setAnimation] = useState({ active: false, type: null, actor: null })
  const [health, setHealth] = useState({ user: battleLog[0].userHealth, opponent: battleLog[0].opponentHealth })

  const currentLogEntry = battleLog[logIndex]
  const isBattleOver = currentLogEntry.type === 'end';

  useEffect(() => {
    const entry = battleLog[logIndex]
    const animationTime = 1000; // Shorter animation time

    if (entry.type === 'action') {
      setAnimation({ active: true, type: entry.action, actor: entry.actor })

      setTimeout(() => {
        setHealth({ user: entry.userHealth, opponent: entry.opponentHealth })
        setAnimation({ active: false, type: null, actor: null })
      }, animationTime)
    } else {
      setHealth({ user: entry.userHealth, opponent: entry.opponentHealth })
    }

    // Auto-advance logic
    const autoAdvanceDelay = entry.type === 'action' ? 2500 : 1500; // Longer delay for actions
    if (!isBattleOver) {
      const timer = setTimeout(() => {
        setLogIndex(prevIndex => prevIndex + 1);
      }, autoAdvanceDelay);
      return () => clearTimeout(timer);
    }
  }, [logIndex, battleLog, isBattleOver])

  const getInisContainerStyle = (character) => {
    const isActor = animation.active && animation.actor === character
    const style = {
      transition: 'transform 0.5s ease-in-out',
      transform: 'translateX(0)',
      position: 'relative',
    }
    if (isActor && animation.type === 'attack') {
      style.transform = character === 'user' ? 'translateX(180px)' : 'translateX(-180px)'
    }
    return style
  }

  const getIconContainerStyle = (character) => {
    const isActor = animation.active && animation.actor === character
    const style = {
      position: 'absolute',
      top: '0px', // Adjusted to be closer to the top corner
      right: '0px', // Adjusted to be closer to the right corner
      transform: 'translate(0, 0)', // Initial transform
      opacity: 0,
      transition: 'opacity 0.3s ease-in-out',
      zIndex: 10,
      display: 'flex', // Use flexbox for centering content if needed
      justifyContent: 'center',
      alignItems: 'center',
      width: '100px', // Give it a fixed size to position the icon
      height: '100px',
    }
    if (isActor && ['understand', 'space_out', 'not_listen'].includes(animation.type)) {
      style.opacity = 1
      // Removed shake animation for 'understand' to make it static and prominent
    }
    return style
  }

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(-15deg); }
          50% { transform: translate(-50%, -50%) rotate(15deg); }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px', border: '1px solid #333', borderRadius: '10px', background: 'black', overflow: 'hidden' }}>
        <div style={getInisContainerStyle('user')}>
          <CharacterDisplay character={userChar} health={health.user} maxHealth={battleLog[0].userHealth} isUser={true} />
          <div style={getIconContainerStyle('user')}>
            {animation.active && animation.actor === 'user' && <ActionIcon action={animation.type} />}
          </div>
        </div>

        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>VS</div>

        <div style={getInisContainerStyle('opponent')}>
          <CharacterDisplay character={opponentChar} health={health.opponent} maxHealth={battleLog[0].opponentHealth} isUser={false} />
          <div style={getIconContainerStyle('opponent')}>
            {animation.active && animation.actor === 'opponent' && <ActionIcon action={animation.type} />}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', minHeight: '100px', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'black', whiteSpace: 'pre-wrap', textAlign: 'center', fontWeight: 'bold' }}>{currentLogEntry.message}</p>
      </div>

      {!isBattleOver ? (
        null
      ) : (
        <div style={{ marginTop: '20px', fontWeight: 'bold', color: didWin ? 'green' : 'red', textAlign: 'center' }}>
          <h2>{didWin ? t('common.victory') : t('common.defeat')}</h2>
          {affectionIncreased && <p>{t('common.affectionIncreased')}</p>}
        </div>
      )}
    </div>
  )
}
