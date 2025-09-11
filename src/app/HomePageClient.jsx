'use client'

import AnimatedInis from './AnimatedInis'
import { calculateInisStats } from '@/lib/inis/stats';
import Link from 'next/link'; // Import Link
import StyledButton from './components/StyledButton'; // Import StyledButton
import { useState } from 'react'; // Import useState
import BattleHistoryModal from './components/BattleHistoryModal'; // Import BattleHistoryModal
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePageClient({ user, profile, walkCount, conversationCount, battleCount, maxWalk, maxConversation, maxBattle, userCharacters, shouldRefresh }) {
  const { t, language, changeLanguage } = useLanguage();
  const [showBattleHistory, setShowBattleHistory] = useState(false); // State for showing battle history modal
  const router = useRouter();

  useEffect(() => {
    if (shouldRefresh) {
      router.refresh();
    }
  }, [shouldRefresh, router]);

  return (
    <div style={{ padding: '0', margin: '0' }}> {/* Using a div as a wrapper */}
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
          <span>{user.email}</span>
          <button onClick={() => setShowBattleHistory(true)} style={{ marginLeft: '10px', padding: '8px 12px', border: 'none', borderRadius: '5px', background: '#007bff', color: 'white', cursor: 'pointer' }}>
            {t('common.viewBattleHistory')}
          </button>
          <form action="/auth/signout" method="post" style={{ display: 'inline', marginLeft: '10px' }}>
            <button type="submit">{t('common.logout')}</button>
          </form>
          {/* Language Selector */}
          <select onChange={(e) => changeLanguage(e.target.value)} value={language} style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}>
            <option value="en">🇺🇸 {t('common.english')}</option>
            <option value="ko">🇰🇷 {t('common.korean')}</option>
          </select>
        </div>

        <h1>{t('common.myInis')}</h1>
        
        <div style={{ marginTop: '30px', minHeight: '250px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {userCharacters && userCharacters.length > 0 ? (
            userCharacters.map(uc => (
              <div key={uc.id}>
                <AnimatedInis imageUrl={uc.characters.image_url} />
                {uc && (
                  <>
                    {(() => {
                      const calculatedStats = calculateInisStats({
                        level: uc.level,
                        attack_stat: uc.attack_stat,
                        defense_stat: uc.defense_stat,
                        health_stat: uc.health_stat,
                        recovery_stat: uc.recovery_stat,
                        affection: uc.affection,
                      });
                      return (
                        <div style={{ fontSize: '12px', marginTop: '5px' }}>
                          <p>{t('common.name')}: {uc.name || t('common.noName')}</p>
                          <p>{t('common.level')}: {uc.level}</p>
                          <p>{t('common.attack')}: {calculatedStats.attack_power}</p>
                          <p>{t('common.defense')}: {calculatedStats.defense_power}</p>
                          <p>{t('common.health')}: {calculatedStats.max_health}</p>
                          <p>{t('common.recovery')}: {calculatedStats.recovery_power}</p>
                          <p>{t('common.affection')}: {uc.affection}</p>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            ))
          ) : (
            <div style={{ border: '1px dashed #ccc', borderRadius: '8px', height: '150px', width: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
              <p style={{ fontSize: '12px' }}>{t('common.notAssigned')}<br/>{t('common.dbTriggerInfo')}</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <Link href="/walk">
            <StyledButton style={{ backgroundColor: '#4CAF50', color: 'white' }} faded={walkCount >= maxWalk}>
              {t('common.walk')} ({walkCount}/{maxWalk})
            </StyledButton>
          </Link>
          <Link href="/conversation">
            <StyledButton style={{ backgroundColor: '#FFC107', color: 'white' }} faded={conversationCount >= maxConversation}>
              {t('common.conversation')} ({conversationCount}/{maxConversation})
            </StyledButton>
          </Link>
          <Link href="/battle">
            <StyledButton style={{ backgroundColor: '#F44336', color: 'white' }} faded={battleCount >= maxBattle}>
              {t('common.battle')} ({battleCount}/{maxBattle})
            </StyledButton>
          </Link>
        </div>
        {showBattleHistory && <BattleHistoryModal onClose={() => setShowBattleHistory(false)} />}
      </div>
    </div>
  );
}
