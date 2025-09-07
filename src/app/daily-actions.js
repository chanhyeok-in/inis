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

  const affectionInfluence = affection * 0.000025;
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
  const supabase = getSupabaseServerClient();
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
    const { data: userCharacter } = await supabase.from('user_characters').select('character_id').eq('user_id', user.id).single()
    if (userCharacter) {
      const { data: character } = await supabase.from('characters').select('affection').eq('id', userCharacter.character_id).single()
      if (character) {
        const { error: affectionError } = await supabase.from('characters').update({ affection: character.affection + 1 }).eq('id', userCharacter.character_id)
        if (!affectionError) affectionIncreased = true
      }
    }
  }
  return { success: true, message: affectionIncreased ? '산책 완료! 유대감이 1 증가했습니다!' : '산책 완료!' }
}

export async function performConversation() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: '로그인되지 않았습니다.' }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('conversation_count, last_daily_reset').eq('id', user.id).single()
  if (profileError || !profile) return { success: false, message: '프로필을 찾을 수 없습니다.' }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('conversation_count').eq('id', user.id).single()
  if (updatedProfile.conversation_count >= 3) return { success: false, message: '오늘은 이미 대화를 3번 했습니다.' }

  const { error: updateError } = await supabase.from('profiles').update({ conversation_count: updatedProfile.conversation_count + 1 }).eq('id', user.id)
  if (updateError) return { success: false, message: '대화 횟수 업데이트에 실패했습니다.' }

  let affectionIncreased = false
  if (Math.random() < 0.10) {
    const { data: userCharacter } = await supabase.from('user_characters').select('character_id').eq('user_id', user.id).single()
    if (userCharacter) {
      const { data: character } = await supabase.from('characters').select('affection').eq('id', userCharacter.character_id).single()
      if (character) {
        const { error: affectionError } = await supabase.from('characters').update({ affection: character.affection + 1 }).eq('id', userCharacter.character_id)
        if (!affectionError) affectionIncreased = true
      }
    }
  }
  return { success: true, message: affectionIncreased ? '대화 완료! 유대감이 1 증가했습니다!' : '대화 완료!' }
}

export async function performBattle() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: '로그인되지 않았습니다.' }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('battle_count, last_daily_reset').eq('id', user.id).single()
  if (profileError || !profile) return { success: false, message: '프로필을 찾을 수 없습니다.' }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('battle_count').eq('id', user.id).single()
  if (updatedProfile.battle_count >= 1) return { success: false, message: '오늘은 이미 전투를 했습니다.' }

  const { data: userCharacterLink } = await supabase.from('user_characters').select('character_id').eq('user_id', user.id).single()
  if (!userCharacterLink) return { success: false, message: '사용자 캐릭터를 찾을 수 없습니다.' }

  const { data: userChar } = await supabase.from('characters').select('image_url, level, attack_stat, defense_stat, health_stat, recovery_stat, affection').eq('id', userCharacterLink.character_id).single()
  if (!userChar) return { success: false, message: '사용자 캐릭터 스탯을 불러올 수 없습니다.' }

  await supabase.from('profiles').update({ battle_count: updatedProfile.battle_count + 1 }).eq('id', user.id)

  const userCalculatedStats = calculateInisStats(userChar)
  const opponentChar = {
    id: 999, level: userChar.level, attack_stat: Math.max(1, userChar.attack_stat + Math.floor(Math.random() * 11) - 5),
    defense_stat: Math.max(1, userChar.defense_stat + Math.floor(Math.random() * 11) - 5), health_stat: Math.max(1, userChar.health_stat + Math.floor(Math.random() * 11) - 5),
    recovery_stat: Math.max(1, userChar.recovery_stat + Math.floor(Math.random() * 11) - 5), affection: Math.floor(Math.random() * 10000) + 1, image_url: '/globe.svg',
  }
  const opponentCalculatedStats = calculateInisStats(opponentChar)

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
      const damage = Math.max(0, userCalculatedStats.attack_power - opponentCalculatedStats.defense_power)
      opponentHealth -= damage
      turnMessage += `
상대에게 ${damage}의 데미지!`
    } else {
      turnMessage += '\n아무 일도 일어나지 않았다.'
    }
    battleLog.push({ message: turnMessage, userHealth, opponentHealth: Math.max(0, opponentHealth) });
    if (opponentHealth <= 0) break;

    const opponentAction = getBattleAction(opponentChar.affection)
    turnMessage = `상대 이니스 행동: ${opponentAction}`
    if (opponentAction === 'attack') {
      const damage = Math.max(0, opponentCalculatedStats.attack_power - userCalculatedStats.defense_power)
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
      opponentChar: { ...opponentChar, current_health: opponentCalculatedStats.max_health },
      battleLog,
      didWin,
      affectionIncreased,
    },
  }
}