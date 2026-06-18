const BASE_HEALTH = 100;

export function calculateHealth(account: any) {
  let health = BASE_HEALTH;

  if (account.flood_count > 3) health -= 30;
  if (account.cooldown_until && new Date(account.cooldown_until) > new Date()) health -= 50;

  return Math.max(0, health);
}

export function getHealthTier(health: number) {
  if (health > 80) return 'green';
  if (health > 50) return 'yellow';
  return 'red';
}
