export function getWarmupStage(createdAt: Date) {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

  if (days < 2) return 1;
  if (days < 4) return 2;
  if (days < 6) return 3;
  return 4;
}