export function calculateInisStats(stats) {
  const baseAttack = 0;
  const baseDefense = 0;
  const baseHealth = 20;
  const baseRecovery = 0;

  const attack_power = baseAttack + ((stats.attack_stat ?? 0) * 3);
  const defense_power = baseDefense + ((stats.defense_stat ?? 0) * 3);
  const max_health = baseHealth + ((stats.health_stat ?? 0) * 5);
  const recovery_power = baseRecovery + ((stats.recovery_stat ?? 0) * 1);

  return {
    attack_power,
    defense_power,
    max_health,
    recovery_power,
  };
}