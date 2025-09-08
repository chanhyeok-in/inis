'use server'

import { calculateInisStats } from '@/lib/inis/stats.js';
import { getSupabaseServerClient } from '@/lib/supabase/server-utils.js';

// Helper to get action based on affection
function getBattleAction(affection) {
  const baseProbabilities = {
    attack: 0.25,
    understand: 0.25,
    space_out: 0.25,
    not_listen: 0.25,
  };

  const affectionInfluence = affection * 0.0025; // Corrected from 0.000025 to 0.0025
  let attackProb = baseProbabilities.attack + affectionInfluence;
  let notListenProb = baseProbabilities.not_listen - affectionInfluence;

  attackProb = Math.max(0, Math.min(1, attackProb));
  notListenProb = Math.max(0, Math.min(1, notListenProb));

  const totalAdjustedProb = attackProb + baseProbabilities.understand + baseProbabilities.space_out + notListenProb;
  const normalizedAttack = attackProb / totalAdjustedProb;
  const normalizedUnderstand = baseProbabilities.understand / totalAdjustedProb;
  const normalizedSpaceOut = baseProbabilities.space_out / totalAdjustedProb;
  const normalizedNotListen = notListenProb / totalAdjustedProb;

  const rand = Math.random();

  if (rand < normalizedAttack) return 'attack';
  if (rand < normalizedAttack + normalizedUnderstand) return 'understand';
  if (rand < normalizedAttack + normalizedUnderstand + normalizedSpaceOut) return 'space_out';
  return 'not_listen';
}

async function checkAndResetDailyCounts(supabase, userId, profile) {
  const now = new Date()
  const lastReset = new Date(profile.last_daily_reset)

  if (now.getUTCDay() !== lastReset.getUTCDay() || now.getUTCMonth() !== lastReset.getUTCMonth() || now.getUTCFullYear() !== lastReset.getUTCFullYear()) {
    const { error } = await supabase
      .from('profiles')
      .update({ walk_count: 0, conversation_count: 0, battle_count: 0, last_daily_reset: now.toISOString() })
      .eq('id', userId)
    if (error) {
      console.error('Error resetting daily counts:', error)
      return false
    }
    return true
  }
  return false
}

export async function performWalk() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: '로그인되지 않았습니다.' }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('walk_count, last_daily_reset').eq('id', user.id).single()
  if (profileError || !profile) return { success: false, message: '프로필을 찾을 수 없습니다.' }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('walk_count').eq('id', user.id).single()
  if (updatedProfile.walk_count >= 1) return { success: false, message: '오늘은 이미 산책을 했습니다.' }

  const { error: updateError } = await supabase.from('profiles').update({ walk_count: updatedProfile.walk_count + 1 }).eq('id', user.id)
  if (updateError) return { success: false, message: '산책 횟수 업데이트에 실패했습니다.' }

  let affectionIncreased = false
  if (Math.random() < 0.10) {
    const { data: userCharacter } = await supabase.from('user_characters').select('character_id, affection').eq('user_id', user.id).single() // Fetch affection from user_characters
    if (userCharacter) {
      const newAffection = userCharacter.affection + 1; // Use affection from user_characters
      console.log(`Attempting to update user_character ${userCharacter.character_id} affection from ${userCharacter.affection} to ${newAffection}`);
      const { error: affectionError } = await supabase.from('user_characters').update({ affection: newAffection }).eq('character_id', userCharacter.character_id) // Update user_characters
      if (affectionError) {
        console.error('Error updating affection:', affectionError);
      } else {
        affectionIncreased = true
        console.log(`Affection updated successfully for user_character ${userCharacter.character_id}`);
      }
    } else {
      console.error('User character link not found for affection update.');
    }
  }
  
  let message = '시원한 바람을 맞으며 이니스와 함께 들판을 달렸다.';
  if (affectionIncreased) {
    message += '\n이니스 기분이 매우 좋아졌습니다 ! (유대감 +1)';
  }
  return { success: true, message: message };
}

export async function performConversation() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: '로그인되지 않습니다.' }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('conversation_count, last_daily_reset').eq('id', user.id).single()
  if (profileError || !profile) return { success: false, message: '프로필을 찾을 수 없습니다.' }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('conversation_count').eq('id', user.id).single()
  if (updatedProfile.conversation_count >= 3) return { success: false, message: '오늘은 이미 대화를 3번 했습니다.' }

  const { error: updateError } = await supabase.from('profiles').update({ conversation_count: updatedProfile.conversation_count + 1 }).eq('id', user.id)
  if (updateError) return { success: false, message: '대화 횟수 업데이트에 실패했습니다.' }

  let affectionIncreased = false
  if (Math.random() < 0.10) {
    const { data: userCharacter } = await supabase.from('user_characters').select('character_id, affection').eq('user_id', user.id).single() // Fetch affection from user_characters
    if (userCharacter) {
      const newAffection = userCharacter.affection + 1; // Use affection from user_characters
      console.log(`Attempting to update user_character ${userCharacter.character_id} affection from ${userCharacter.affection} to ${newAffection}`);
      const { error: affectionError } = await supabase.from('user_characters').update({ affection: newAffection }).eq('user_id', user.id).eq('character_id', userCharacter.character_id) // Update user_characters
      if (affectionError) {
        console.error('Error updating affection:', affectionError);
      } else {
        affectionIncreased = true
        console.log(`Affection updated successfully for user_character ${userCharacter.character_id}`);
      }
    } else {
      console.error('User character link not found for affection update.');
    }
  }

  const everydayMessages = [
    '이니스는 오늘 날씨가 좋다고 말했다.',
    '이니스는 어제 본 드라마 이야기를 해줬다.',
    '이니스는 김치찌개는 맛이없다고 말해줬다.',
    '이니스는 오늘 저녁으로 뭘 먹을지 고민했다.',
  ];

  let message = '';
  if (affectionIncreased) {
    message = '이니스와 진심을 이야기 해주었다. (유대감 +1)';
  } else {
    message = everydayMessages[Math.floor(Math.random() * everydayMessages.length)];
  }
  return { success: true, message: message };
}

export async function performBattle(prevState, formData) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: '로그인되지 않습니다.' }

  const battleMode = formData.get('battleMode');
  let opponentId = null;

  console.log(`performBattle called with battleMode: ${battleMode}`); // Added log

  if (battleMode === 'nearby') {
    opponentId = formData.get('opponentId');
    if (!opponentId) {
      return { success: false, message: '전투할 상대를 선택해주세요.' };
    }
  } else if (battleMode === 'random') {
    const { data: userCharacterLink } = await supabase.from('user_characters').select('character_id, level').eq('user_id', user.id).single()
    if (!userCharacterLink) return { success: false, message: '사용자 캐릭터를 찾을 수 없습니다.' }

    const userLevel = userCharacterLink.level;
    const levelTolerance = 2; // Opponent level within +/- 2 of user's level

    console.log(`User ${user.id} level: ${userLevel}`);

    const { data: potentialOpponents, error: oppError } = await supabase
      .from('user_characters')
      .select('user_id, level')
      .neq('user_id', user.id)
      .gte('level', userLevel - levelTolerance)
      .lte('level', userLevel + levelTolerance);

    if (oppError) {
      console.error('Error fetching potential opponents:', oppError);
      return { success: false, message: '랜덤 전투 상대를 찾을 수 없습니다. 나중에 다시 시도해주세요.' };
    }

    console.log('Potential opponents found:', potentialOpponents);

    if (!potentialOpponents || potentialOpponents.length === 0) {
      return { success: false, message: '랜덤 전투 상대를 찾을 수 없습니다. 나중에 다시 시도해주세요.' };
    }

    const randomOpponent = potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)];
    opponentId = randomOpponent.user_id;

    console.log('Selected random opponent:', randomOpponent);

  } else {
    return { success: false, message: '유효하지 않은 전투 모드입니다.' };
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('battle_count, last_daily_reset').eq('id', user.id).single()
  if (profileError || !profile) return { success: false, message: '프로필을 찾을 수 없습니다.' }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('battle_count').eq('id', user.id).single()
  if (updatedProfile.battle_count >= 1) return { success: false, message: '오늘은 이미 전투를 했습니다.' }

  const { data: userCharacterLink } = await supabase.from('user_characters').select('character_id, level, attack_stat, defense_stat, health_stat, recovery_stat, affection').eq('user_id', user.id).single()
  if (!userCharacterLink) return { success: false, message: '사용자 캐릭터를 찾을 수 없습니다.' }

  const userChar = userCharacterLink; // userChar now directly contains stats from user_characters

  // Fetch opponent's character data
  const { data: opponentCharacterLink, error: oppCharLinkError } = await supabase
    .from('user_characters')
    .select('character_id, name, image_url, level, attack_stat, defense_stat, health_stat, recovery_stat, affection')
    .eq('user_id', opponentId)
    .single();

  if (oppCharLinkError || !opponentCharacterLink) {
    return { success: false, message: '선택한 상대의 캐릭터를 찾을 수 없습니다.' };
  }

  const opponentCharData = opponentCharacterLink; // opponentCharData now directly contains stats from user_characters

  await supabase.from('profiles').update({ battle_count: updatedProfile.battle_count + 1 }).eq('id', user.id)

  const userCalculatedStats = calculateInisStats(userChar)
  const opponentCalculatedStats = calculateInisStats(opponentCharData)

  let userHealth = userCalculatedStats.max_health;
  let opponentHealth = opponentCalculatedStats.max_health;

  const battleLog = [];
  battleLog.push({ message: '전투 시작!', userHealth, opponentHealth });

  let turn = 1
  const maxTurns = 20

  while (userHealth > 0 && opponentHealth > 0 && turn <= maxTurns) {
    let turnMessage = `--- 턴 ${turn} ---
`;

    const userAction = getBattleAction(userChar.affection)
    turnMessage += `내 이니스 행동: ${userAction}`
    if (userAction === 'attack') {
      const damage = Math.max(0, userCalculatedStats.attack_power - opponentCalculatedStats.defense_defense)
      opponentHealth -= damage
      turnMessage += `
상대에게 ${damage}의 데미지!`
    } else {
      turnMessage += '\n아무 일도 일어나지 않았다.'
    }
    battleLog.push({ message: turnMessage, userHealth, opponentHealth: Math.max(0, opponentHealth) });
    if (opponentHealth <= 0) break;

    const opponentAction = getBattleAction(opponentCharData.affection)
    turnMessage = `상대 이니스 행동: ${opponentAction}`
    if (opponentAction === 'attack') {
      const damage = Math.max(0, opponentCalculatedStats.attack_power - userCalculatedStats.defense_defense)
      userHealth -= damage
      turnMessage += `
내게 ${damage}의 데미지!`
    } else {
      turnMessage += '\n아무 일도 일어나지 않았다.'
    }
    battleLog.push({ message: turnMessage, userHealth: Math.max(0, userHealth), opponentHealth });
    if (userHealth <= 0) break;

    const userRecovery = userCalculatedStats.recovery_power;
    const opponentRecovery = opponentCalculatedStats.recovery_power;
    userHealth = Math.min(userCalculatedStats.max_health, userHealth + userRecovery)
    opponentHealth = Math.min(opponentCalculatedStats.max_health, opponentHealth + opponentRecovery)
    battleLog.push({ message: '양측 모두 체력을 일부 회복했다.', userHealth, opponentHealth });

    turn++
  }

  const didWin = userHealth > 0
  let affectionIncreased = false
  if (didWin) {
    const { data: character } = await supabase.from('characters').select('affection').eq('id', userCharacterLink.character_id).single()
    if (character) {
      const { error: affectionError } = await supabase.from('characters').update({ affection: character.affection + 1 }).eq('id', userCharacterLink.character_id)
      if (!affectionError) affectionIncreased = true
    }
  }

  const finalMessage = didWin ? (affectionIncreased ? '전투 승리! 유대감이 1 증가했습니다!' : '전투 승리!') : '전투 패배!';
  battleLog.push({ message: finalMessage, userHealth, opponentHealth });

  return {
    success: true,
    battleData: {
      userChar: { ...userChar, current_health: userCalculatedStats.max_health },
      opponentChar: { ...opponentCharData, current_health: opponentCalculatedStats.max_health },
      battleLog,
      didWin,
      affectionIncreased,
    },
  }
}