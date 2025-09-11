'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from './LoadingSpinner';

export default function BattleHistoryModal({ userId, onClose }) {
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
          .select('id, opponent1_id, opponent2_id, result_type, winner_id, battle_timestamp, battle_type') // Select only direct columns
          .or(`opponent1_id.eq.${userId},opponent2_id.eq.${userId}`) // Filter by user ID
          .order('battle_timestamp', { ascending: false }); // Order by timestamp descending

        if (battleHistoryError) {
          throw battleHistoryError;
        }

        // Extract unique opponent IDs
        const opponentIds = new Set();
        battleHistoryData.forEach(entry => {
          const opponentId = entry.opponent1_id === userId ? entry.opponent2_id : entry.opponent1_id;
          if (opponentId) {
            opponentIds.add(opponentId);
          }
        });

        // Fetch opponent profiles and characters in bulk
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
        const userCharactersMap = new Map(userCharactersData.map(uc => [uc.user_id, uc])); // Assuming one character per user for simplicity

        const combinedHistory = battleHistoryData.map(entry => {
          const opponentId = entry.opponent1_id === userId ? entry.opponent2_id : entry.opponent1_id;
          const opponentProfile = profilesMap.get(opponentId);
          const opponentChar = userCharactersMap.get(opponentId);

          return {
            ...entry,
            opponent_username: opponentProfile?.username || '알 수 없음',
            opponent_inis_name: opponentChar?.name || '이름 없음',
            opponent_inis_level: opponentChar?.level || 0,
          };
        });
        setHistory(combinedHistory || []);
      } catch (err) {
        console.error('Error fetching battle history:', err);
        setError('전투 기록을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchBattleHistory();
  }, [userId]);

  const getResultText = (entry) => {
    if (entry.result_type === 'WIN') {
      return entry.winner_id === userId ? '승리' : '패배';
    } else if (entry.result_type === 'LOSE') {
      return entry.winner_id === userId ? '승리' : '패배'; // Should not happen if winner_id is correctly set
    } else if (entry.result_type === 'DRAW') {
      return '무승부';
    }
    return '알 수 없음';
  };

  const getOpponentId = (entry) => {
    return entry.opponent1_id === userId ? entry.opponent2_id : entry.opponent1_id;
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
        color: 'black', // Ensure text is visible on white background
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
        <h2 style={{ marginTop: '0', marginBottom: '20px', textAlign: 'center' }}>전투 기록</h2>

        {loading && <LoadingSpinner />}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        {!loading && !error && history.length === 0 && (
          <p style={{ textAlign: 'center' }}>전투 기록이 없습니다.</p>
        )}

        {!loading && !error && history.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>날짜</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>전투 유형</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>상대방 ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>결과</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{new Date(entry.battle_timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>{entry.battle_type === 'ranked' ? '랭크' : '일반'}</td>
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