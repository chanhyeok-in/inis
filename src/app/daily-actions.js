'use server'

import { calculateInisStats } from '@/lib/inis/stats.js';
import { getSupabaseServerClient } from '@/lib/supabase/server-utils.js';
import { revalidatePath } from 'next/cache';
import { getTranslation } from '@/lib/i18n';

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

// Helper for Korean postpositions
function withKoreanPostposition(name, particle) {
  if (typeof name !== 'string' || name.length === 0) return name;
  const lastChar = name.charCodeAt(name.length - 1);
  // Check if the last character is within the Hangul range
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
    return name + (particle === '은/는' ? '는' : '가'); // Default for non-Hangul
  }
  const hasJongseong = (lastChar - 0xAC00) % 28 > 0;
  if (particle === '은/는') {
    return name + (hasJongseong ? '은' : '는');
  }
  if (particle === '이/가') {
    return name + (hasJongseong ? '이' : '가');
  }
  return name;
}

export async function checkAndResetDailyCounts(supabase, userId, profile) {
  const now = new Date()
  const lastReset = new Date(profile.last_daily_reset)

  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const lastResetUTC = new Date(Date.UTC(lastReset.getUTCFullYear(), lastReset.getUTCMonth(), lastReset.getUTCDate(), 0, 0, 0, 0));

  if (todayUTC > lastResetUTC) {
    const { error } = await supabase
      .from('profiles')
      .update({ walk_count: 0, conversation_count: 0, battle_count: 0, last_daily_reset: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)).toISOString() })
      .eq('id', userId)
    if (error) {
      console.error('Error resetting daily counts:', error)
      return { success: false };
    }
    revalidatePath('/'); // Revalidate the home page
    return { success: true };
  }
  return false
}

export async function performWalk() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: t('common.loginRequired') }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('walk_count, last_daily_reset, language').eq('id', user.id).single()
  const lang = profile?.language || 'en';
  const t = (key, vars) => getTranslation(lang, key, vars);

  if (profileError || !profile) return { success: false, message: t('common.profileNotFound') }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('walk_count').eq('id', user.id).single()
  if (updatedProfile.walk_count >= 1) return { success: false, message: t('common.alreadyWalked') }

  const { error: updateError } = await supabase.from('profiles').update({ walk_count: updatedProfile.walk_count + 1 }).eq('id', user.id)
  if (updateError) return { success: false, message: t('common.walkUpdateFailed') }
  revalidatePath('/'); // Revalidate the main page to show updated counts

  let affectionIncreased = false
  let userCharacter = null; // Declare userCharacter outside the if block
  if (Math.random() < 0.10) {
    const { data, error: userCharError } = await supabase.from('user_characters').select('id, user_id, character_id, created_at, level, attack_stat, defense_stat, health_stat, recovery_stat, affection, name').eq('user_id', user.id).single() // Fetch all character data
    if (userCharError) {
      console.error('Error fetching user character for walk:', userCharError);
    }
    if (data) { // Use 'data' here
      userCharacter = data; // Assign fetched data to userCharacter
      const updatedCharacter = { ...userCharacter, affection: userCharacter.affection + 1 };
      const payload = {
        user_id: updatedCharacter.user_id,
        character_id: updatedCharacter.character_id,
        created_at: updatedCharacter.created_at,
        level: updatedCharacter.level,
        attack_stat: updatedCharacter.attack_stat,
        defense_stat: updatedCharacter.defense_stat,
        health_stat: updatedCharacter.health_stat,
        recovery_stat: updatedCharacter.recovery_stat,
        affection: updatedCharacter.affection,
        name: updatedCharacter.name,
      };
      console.log(`Attempting to update user_character ${userCharacter.id} affection from ${userCharacter.affection} to ${updatedCharacter.affection}`);
      const { error: affectionError } = await supabase.from('user_characters').update(payload).eq('id', userCharacter.id) // Update user_characters
      if (affectionError) {
        console.error('Error updating affection:', affectionError);
      } else {
        affectionIncreased = true
        console.log(`Affection updated successfully for user_character ${userCharacter.id}`);
      }
    } else {
      console.error('User character link not found for affection update.');
    }
  }
  
  const inisName = userCharacter?.name || t('common.inis');
  const inisSubject = lang === 'ko' ? withKoreanPostposition(inisName, '은/는') : inisName;
  let message = t('common.walkMessage', { inisSubject });
  if (affectionIncreased) {
    message += '\n' + t('common.affectionIncreasedMessage');
  }
  return { success: true, message: message };
}

export async function performConversation() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: t('common.loginRequired') }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('conversation_count, last_daily_reset, language').eq('id', user.id).single()
  const lang = profile?.language || 'en';
  const t = (key, vars) => getTranslation(lang, key, vars);

  if (profileError || !profile) return { success: false, message: t('common.profileNotFound') }

  await checkAndResetDailyCounts(supabase, user.id, profile)

  const { data: updatedProfile } = await supabase.from('profiles').select('conversation_count').eq('id', user.id).single()
  if (updatedProfile.conversation_count >= 3) return { success: false, message: t('common.alreadyConversed') }

  const { error: updateError } = await supabase.from('profiles').update({ conversation_count: updatedProfile.conversation_count + 1 }).eq('id', user.id)
  if (updateError) return { success: false, message: t('common.conversationUpdateFailed') }
  revalidatePath('/'); // Revalidate the main page to show updated counts

  let affectionIncreased = false
  let userCharacter = null; // Declare userCharacter outside the if block
  if (Math.random() < 0.10) {
    const { data, error: userCharError } = await supabase.from('user_characters').select('id, user_id, character_id, created_at, level, attack_stat, defense_stat, health_stat, recovery_stat, affection, name').eq('user_id', user.id).single() // Fetch all character data
    if (userCharError) {
      console.error('Error fetching user character for conversation:', userCharError);
    }
    if (data) { // Use 'data' here
      userCharacter = data; // Assign fetched data to userCharacter
      const updatedCharacter = { ...userCharacter, affection: userCharacter.affection + 1 };
      const payload = {
        user_id: updatedCharacter.user_id,
        character_id: updatedCharacter.character_id,
        created_at: updatedCharacter.created_at,
        level: updatedCharacter.level,
        attack_stat: updatedCharacter.attack_stat,
        defense_stat: updatedCharacter.defense_stat,
        health_stat: updatedCharacter.health_stat,
        recovery_stat: updatedCharacter.recovery_stat,
        affection: updatedCharacter.affection,
        name: updatedCharacter.name,
      };
      console.log(`Attempting to update user_character ${userCharacter.id} affection from ${userCharacter.affection} to ${updatedCharacter.affection}`);
      const { error: affectionError } = await supabase.from('user_characters').update(payload).eq('id', userCharacter.id) // Update user_characters
      if (affectionError) {
        console.error('Error updating affection:', affectionError);
      } else {
        affectionIncreased = true
        console.log(`Affection updated successfully for user_character ${userCharacter.id}`);
      }
    } else {
      console.error('User character link not found for affection update.');
    }
  }

  const inisName = userCharacter?.name || t('common.inis');
  const inisSubject = lang === 'ko' ? withKoreanPostposition(inisName, '은/는') : inisName;
  const everydayMessages = [
    t('common.conversationMessageRandom1', { inisSubject }), 
    t('common.conversationMessageRandom2', { inisSubject }), 
    t('common.conversationMessageRandom3', { inisSubject }), 
    t('common.conversationMessageRandom4', { inisSubject }), 
  ];

  let message = '';
  if (affectionIncreased) {
    message = t('common.conversationMessageAffection', { inisSubject });
  } else {
    message = everydayMessages[Math.floor(Math.random() * everydayMessages.length)];
  }
  return { success: true, message: message };
}

export async function performBattle(prevState, formData) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: '로그인되지 않습니다.' };

  // Fetch profile and language first
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('battle_count, last_daily_reset, ranked_win, ranked_draw, ranked_lose, normal_win, normal_draw, normal_lose, language')
    .eq('id', user.id)
    .single();

  const lang = profile?.language || 'en';
  const t = (key, vars) => getTranslation(lang, key, vars);

  if (profileError || !profile) return { success: false, message: t('common.profileNotFound') };

  const battleMode = formData.get('battleMode');
  let opponentId = null;

  if (battleMode === 'nearby') {
    opponentId = formData.get('opponentId');
    if (!opponentId) {
      return { success: false, message: t('common.selectOpponentPrompt') };
    }
  } else if (battleMode === 'random') {
    const { data: userCharacterLink } = await supabase.from('user_characters').select('character_id, level').eq('user_id', user.id).single();
    if (!userCharacterLink) return { success: false, message: t('common.userCharacterNotFound') };

    const userLevel = userCharacterLink.level;
    const levelTolerance = 2;

    const { data: potentialOpponents, error: oppError } = await supabase
      .from('user_characters')
      .select('user_id, level')
      .neq('user_id', user.id)
      .gte('level', userLevel - levelTolerance)
      .lte('level', userLevel + levelTolerance);

    if (oppError) {
      console.error('Error fetching potential opponents:', oppError);
      return { success: false, message: t('common.noRandomOpponent') };
    }

    if (!potentialOpponents || potentialOpponents.length === 0) {
      return { success: false, message: t('common.noRandomOpponent') };
    }

    const randomOpponent = potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)];
    opponentId = randomOpponent.user_id;
  } else {
    return { success: false, message: t('common.invalidBattleMode') };
  }

  await checkAndResetDailyCounts(supabase, user.id, profile);

  const { data: updatedProfile } = await supabase.from('profiles').select('battle_count').eq('id', user.id).single();

  if (battleMode === 'random' && updatedProfile.battle_count >= 1) {
    return { success: false, message: t('common.alreadyBattled') };
  }

  const { data: currentUserProfile, error: currentUserProfileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (currentUserProfileError || !currentUserProfile) {
    return { success: false, message: t('common.currentUserProfileError') };
  }

  const { data: userCharacterLink } = await supabase.from('user_characters').select('id, user_id, character_id, created_at, name, level, attack_stat, defense_stat, health_stat, recovery_stat, affection, characters(image_url)').eq('user_id', user.id).single();
  if (!userCharacterLink) return { success: false, message: t('common.userCharacterNotFound') };

  const userChar = {
    ...userCharacterLink,
    image_url: userCharacterLink.characters.image_url,
    username: currentUserProfile.username,
  };
  delete userChar.characters;

  const { data: opponentCharacterLink, error: oppCharLinkError } = await supabase
    .from('user_characters')
    .select('character_id, name, level, attack_stat, defense_stat, health_stat, recovery_stat, affection, characters(image_url)')
    .eq('user_id', opponentId)
    .single();

  if (oppCharLinkError || !opponentCharacterLink) {
    return { success: false, message: t('common.opponentNotFound') };
  }

  const opponentCharData = {
    ...opponentCharacterLink,
    image_url: opponentCharacterLink.characters.image_url,
  };
  delete opponentCharData.characters;

  const { data: opponentProfile, error: opponentProfileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', opponentId)
    .single();

  if (opponentProfileError || !opponentProfile) {
    console.warn(`Could not fetch profile for opponent ID: ${opponentId}. Defaulting username.`);
    opponentCharData.username = t('common.unknown');
  } else {
    opponentCharData.username = opponentProfile.username;
  }

  if (battleMode === 'random') {
    await supabase.from('profiles').update({ battle_count: updatedProfile.battle_count + 1 }).eq('id', user.id);
    revalidatePath('/');
  }

  const userCalculatedStats = calculateInisStats(userChar);
  const opponentCalculatedStats = calculateInisStats(opponentCharData);

  let userHealth = userCalculatedStats.max_health;
  let opponentHealth = opponentCalculatedStats.max_health;

  const battleLog = [];
  battleLog.push({ type: 'start', message: t('common.battleStart'), userHealth, opponentHealth });

  let turn = 1;
  const maxTurns = 20;

  while (userHealth > 0 && opponentHealth > 0 && turn <= maxTurns) {
    const userAction = getBattleAction(userChar.affection);
    let userDamage = 0;
    let userMessage = '';
    const userName = userChar.name || t('common.noName');
    const userSubject = lang === 'ko' ? withKoreanPostposition(userName, '은/는') : userName;

    if (userAction === 'attack') {
      let calculatedDamage = (6 * (1 + userChar.attack_stat)) - (2 * (1 + opponentCharData.defense_stat));
      let baseDamage = Math.max(0, calculatedDamage);
      const isCritical = Math.random() < 0.25;
      userDamage = isCritical ? baseDamage * 2 : baseDamage;
      opponentHealth -= userDamage;
      userMessage = t('common.attackAction', { inisSubject: userSubject, damage: userDamage });
      if (isCritical) userMessage += t('common.criticalHit');
    } else if (userAction === 'understand') {
      userMessage = t('common.understandAction', { inisSubject: userSubject });
    } else if (userAction === 'space_out') {
      userMessage = t('common.spaceOutAction', { inisSubject: userSubject });
    } else { // not_listen
      userMessage = t('common.notListenAction', { inisSubject: userSubject });
    }

    battleLog.push({
      type: 'action',
      turn,
      actor: 'user',
      action: userAction,
      damage: userDamage,
      message: userMessage,
      userHealth,
      opponentHealth: Math.max(0, opponentHealth),
    });

    if (opponentHealth <= 0) break;

    const opponentAction = getBattleAction(opponentCharData.affection);
    let opponentDamage = 0;
    let opponentMessage = '';
    const opponentName = opponentCharData.name || t('common.noName');
    const opponentSubject = lang === 'ko' ? withKoreanPostposition(opponentName, '은/는') : opponentName;

    if (opponentAction === 'attack') {
      let calculatedDamage = (6 * (1 + opponentCharData.attack_stat)) - (2 * (1 + userChar.defense_stat));
      let baseDamage = Math.max(0, calculatedDamage);
      const isCritical = Math.random() < 0.25;
      opponentDamage = isCritical ? baseDamage * 2 : baseDamage;
      userHealth -= opponentDamage;
      opponentMessage = t('common.attackAction', { inisSubject: opponentSubject, damage: opponentDamage });
      if (isCritical) opponentMessage += t('common.criticalHit');
    } else if (opponentAction === 'understand') {
      opponentMessage = t('common.understandAction', { inisSubject: opponentSubject });
    } else if (opponentAction === 'space_out') {
      opponentMessage = t('common.spaceOutAction', { inisSubject: opponentSubject });
    } else { // not_listen
      opponentMessage = t('common.notListenAction', { inisSubject: opponentSubject });
    }

    battleLog.push({
      type: 'action',
      turn,
      actor: 'opponent',
      action: opponentAction,
      damage: opponentDamage,
      message: opponentMessage,
      userHealth: Math.max(0, userHealth),
      opponentHealth,
    });

    if (userHealth <= 0) break;

    const userRecovery = userCalculatedStats.recovery_power;
    const opponentRecovery = opponentCalculatedStats.recovery_power;
    if (userRecovery > 0 || opponentRecovery > 0) {
      userHealth = Math.min(userCalculatedStats.max_health, userHealth + userRecovery);
      opponentHealth = Math.min(opponentCalculatedStats.max_health, opponentHealth + opponentRecovery);
      battleLog.push({
        type: 'recovery',
        message: t('common.recoveryMessage', { userRecovery, opponentRecovery }),
        userHealth,
        opponentHealth,
      });
    }

    turn++;
  }

  const didWin = userHealth > 0 && opponentHealth <= 0;
  const didLose = opponentHealth > 0 && userHealth <= 0;
  const didDraw = userHealth > 0 && opponentHealth > 0 && turn > maxTurns;

  let finalMessage = '';
  let affectionChange = 0;
  let levelChange = 0;
  let statIncrease = null;

  const statNames = {
    'attack_stat': t('common.attack'),
    'defense_stat': t('common.defense'),
    'health_stat': t('common.health'),
    'recovery_stat': t('common.recovery'),
  };

  if (battleMode === 'random') {
    if (didWin) {
      finalMessage = t('common.victory');
      affectionChange = 1;
      levelChange = 1;
    } else if (didLose) {
      finalMessage = t('common.defeat');
      affectionChange = 1;
    } else if (didDraw) {
      finalMessage = t('common.draw');
      levelChange = 1;
    }

    if (didWin || didDraw) {
      const statsToIncrease = ['attack_stat', 'defense_stat', 'health_stat', 'recovery_stat'];
      statIncrease = statsToIncrease[Math.floor(Math.random() * statsToIncrease.length)];
    }
  } else {
    finalMessage = didWin ? t('common.victory') : didLose ? t('common.defeat') : t('common.draw');
    affectionChange = 0;
    levelChange = 0;
    statIncrease = null;
  }

  let updatedUserChar = { ...userChar };

  if (levelChange > 0) updatedUserChar.level += levelChange;
  if (affectionChange > 0) updatedUserChar.affection += affectionChange;
  if (statIncrease) updatedUserChar[statIncrease] = (updatedUserChar[statIncrease] ?? 0) + 1;

  if (levelChange > 0 || affectionChange > 0 || statIncrease) {
    const payloadToUpdate = {
      user_id: updatedUserChar.user_id,
      character_id: updatedUserChar.character_id,
      created_at: updatedUserChar.created_at,
      level: updatedUserChar.level,
      attack_stat: updatedUserChar.attack_stat,
      defense_stat: updatedUserChar.defense_stat,
      health_stat: updatedUserChar.health_stat,
      recovery_stat: updatedUserChar.recovery_stat,
      affection: updatedUserChar.affection,
      name: updatedUserChar.name,
    };

    const { error: updateCharError } = await supabase
      .from('user_characters')
      .update(payloadToUpdate)
      .eq('id', updatedUserChar.id);

    if (updateCharError) {
      console.error('Error updating user character stats:', updateCharError);
      finalMessage += t('common.statUpdateFailed');
    }
  }

  const battleTypePrefix = battleMode === 'random' ? 'ranked' : 'normal';

  if (profile) {
    let updatedProfileStats = { ...profile };
    let resultSuffix = didWin ? 'win' : didDraw ? 'draw' : 'lose';
    const statToIncrement = `${battleTypePrefix}_${resultSuffix}`;
    updatedProfileStats[statToIncrement] = (updatedProfileStats[statToIncrement] || 0) + 1;

    const { error: updateProfileStatsError } = await supabase
      .from('profiles')
      .update({
        ranked_win: updatedProfileStats.ranked_win,
        ranked_draw: updatedProfileStats.ranked_draw,
        ranked_lose: updatedProfileStats.ranked_lose,
        normal_win: updatedProfileStats.normal_win,
        normal_draw: updatedProfileStats.normal_draw,
        normal_lose: updatedProfileStats.normal_lose,
      })
      .eq('id', user.id);

    if (updateProfileStatsError) {
      console.error('Error updating profile battle stats:', updateProfileStatsError);
    }
  }

  let resultType = didWin ? 'WIN' : didDraw ? 'DRAW' : 'LOSE';
  let winnerId = didWin ? user.id : didLose ? opponentId : null;

  const { error: insertBattleHistError } = await supabase
    .from('battle_hist')
    .insert([
      {
        opponent1_id: user.id,
        opponent2_id: opponentId,
        result_type: resultType,
        winner_id: winnerId,
        battle_timestamp: new Date().toISOString(),
        battle_type: battleTypePrefix,
      },
    ]);

  if (insertBattleHistError) {
    console.error('Error inserting battle history:', insertBattleHistError);
  }

  if (battleMode === 'random') { // Only add detailed messages for random battles
    if (didWin) {
      if (affectionChange > 0) finalMessage += ' ' + t('common.affectionIncreased');
      if (levelChange > 0) finalMessage += ' ' + t('common.levelIncreased');
      if (statIncrease) {
        const statName = lang === 'ko' ? withKoreanPostposition(statNames[statIncrease], '이/가') : statNames[statIncrease];
        finalMessage += ' ' + t('common.statIncreased', { statName });
      }
    } else if (didLose) {
      if (affectionChange > 0) finalMessage += ' ' + t('common.affectionIncreased');
    } else if (didDraw) {
      if (levelChange > 0) finalMessage += ' ' + t('common.levelIncreased');
      if (statIncrease) {
        const statName = lang === 'ko' ? withKoreanPostposition(statNames[statIncrease], '이/가') : statNames[statIncrease];
        finalMessage += ' ' + t('common.statIncreased', { statName });
      }
    }
  }

  battleLog.push({ type: 'end', message: finalMessage, userHealth, opponentHealth });

  return {
    success: true,
    battleData: {
      userChar: { ...updatedUserChar, current_health: userCalculatedStats.max_health },
      opponentChar: { ...opponentCharData, current_health: opponentCalculatedStats.max_health },
      battleLog,
      didWin,
      didLose,
      didDraw,
      affectionIncreased: affectionChange > 0,
    },
  }
}

export async function nameInis(prevState, formData) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: t('common.loginRequired') };
  }

  // Fetch profile to get language
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('language')
    .eq('id', user.id)
    .single();

  const lang = profile?.language || 'en';
  const t = (key, vars) => getTranslation(lang, key, vars);

  const inisId = formData.get('inisId');
  const inisName = formData.get('inisName');
  const country = formData.get('country'); // Get country from form data

  const numericInisId = parseInt(inisId, 10);

  if (!inisName || inisName.trim().length === 0) {
    return { success: false, message: t('common.nameRequired') };
  }

  if (inisName.length > 10) {
    return { success: false, message: t('common.nameTooLong') };
  }

  if (!numericInisId) {
    return { success: false, message: t('common.invalidRequest') };
  }

  // Verify the user owns this Inis
  const { data: character, error: ownerError } = await supabase
    .from('user_characters')
    .select('id')
    .eq('user_id', user.id)
    .eq('id', numericInisId)
    .single();

  if (ownerError || !character) {
    console.error('Ownership verification failed:', { ownerError, hasCharacter: !!character });
    return { success: false, message: t('common.ownershipFailed') };
  }

  // Update Inis name
  const { error: nameError } = await supabase
    .from('user_characters')
    .update({ name: inisName.trim() })
    .eq('id', numericInisId);

  if (nameError) {
    console.error('Error naming Inis:', nameError);
    return { success: false, message: t('common.saveFailed') };
  }

  // If country is provided, update profile
  if (country) {
    const { error: countryError } = await supabase
      .from('profiles')
      .update({ country: country })
      .eq('id', user.id);

    if (countryError) {
      console.error('Error updating country:', countryError);
      // Even if country update fails, the name was successful.
      // You might want to return a specific message for this case.
      return { success: true, message: t('common.countryUpdateFailed') };
    }
  }

  revalidatePath('/');
  return { success: true, message: t('common.saveSuccess') };
}