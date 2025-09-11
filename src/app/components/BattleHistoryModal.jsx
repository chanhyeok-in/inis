'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '@/lib/i18n/LanguageProvider'; // Import useLanguage

export default function BattleHistoryModal({ userId, onClose }) {
  const { t } = useLanguage(); // Get translation function
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBattleHistory() {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        const { data: battleHistoryData, error: battleHistoryError } = await supabase
          .from('battle_hist')
          .select('id, opponent1_id, opponent2_id, result_type, winner_id, battle_timestamp, battle_type')
          .or(`opponent1_id.eq.${userId},opponent2_id.eq.${userId}`)
          .order('battle_timestamp', { ascending: false });

        if (battleHistoryError) {
          throw battleHistoryError;
        }

        const opponentIds = new Set();
        battleHistoryData.forEach(entry => {
          const opponentId = entry.opponent1_id === userId ? entry.opponent2_id : entry.opponent1_id;
          if (opponentId) {
            opponentIds.add(opponentId);
          }
        });

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', Array.from(opponentIds));

        if (profilesError) {
          throw profilesError;
        }

        const { data: userCharactersData, error: userCharactersError } = await supabase
          .from('user_characters')
          .select('user_id, name, level')
          .in('user_id', Array.from(opponentIds));

        if (userCharactersError) {
          throw userCharactersError;
        }

        const profilesMap = new Map(profilesData.map(p => [p.id, p]));
        const userCharactersMap = new Map(userCharactersData.map(uc => [uc.user_id, uc]));

        const combinedHistory = battleHistoryData.map(entry => {
          const opponentId = entry.opponent1_id === userId ? entry.opponent2_id : entry.opponent1_id;
          const opponentProfile = profilesMap.get(opponentId);
          const opponentChar = userCharactersMap.get(opponentId);

          return {
            ...entry,
            opponent_username: opponentProfile?.username || t('common.unknown'),
            opponent_inis_name: opponentChar?.name || t('common.noName'),
            opponent_inis_level: opponentChar?.level || 0,
          };
        });
        setHistory(combinedHistory || []);
      } catch (err) {
        console.error('Error fetching battle history:', err);
        setError(t('common.battleHistoryError'));
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchBattleHistory();
    }
  }, [userId, t]);

  const getResultText = (entry) => {
    if (entry.result_type === 'WIN') {
      return entry.winner_id === userId ? t('common.win') : t('common.lose');
    } else if (entry.result_type === 'LOSE') {
      return entry.winner_id === userId ? t('common.win') : t('common.lose');
    } else if (entry.result_type === 'DRAW') {
      return t('common.draw');
    }
    return t('common.unknown');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80%',
        overflowY: 'auto',
        position: 'relative',
        color: 'black',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '1.5em',
            cursor: 'pointer',
            color: '#333',
          }}
        >
          &times;
        </button>
        <h2 style={{ marginTop: '0', marginBottom: '20px', textAlign: 'center' }}>{t('common.battleHistory')}</h2>

        {loading && <LoadingSpinner />}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        {!loading && !error && history.length === 0 && (
          <p style={{ textAlign: 'center' }}>{t('common.noBattleHistory')}</p>
        )}

        {!loading && !error && history.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>{t('common.date')}</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>{t('common.battleType')}</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>{t('common.opponent')}</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>{t('common.result')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{new Date(entry.battle_timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>{entry.battle_type === 'ranked' ? t('common.ranked') : t('common.normal')}</td>
                  <td style={{ padding: '8px' }}>
                    {entry.opponent_username} (Lv.{entry.opponent_inis_level}, {entry.opponent_inis_name})
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: 'black' }}>
                    {getResultText(entry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
