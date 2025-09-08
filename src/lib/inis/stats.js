export function calculateInisStats(stats) {
  const baseAttack = 0;
  const baseDefense = 0;
  const baseHealth = 20;
  const baseRecovery = 0;

  const attack_power = 3 * (1 + (stats.attack_stat ?? 0));
  const defense_power = 2 * (1 + (stats.defense_stat ?? 0));
  const max_health = 20 + (5 * (stats.health_stat ?? 0));
  const recovery_power = 1 + (stats.recovery_stat ?? 0);

  return {
    attack_power,
    defense_power,
    max_health,
    recovery_power,
  };
}