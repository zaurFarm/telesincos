export function calculateTrustScore(user: { hasUsername: boolean, historyLength: number, inGroups?: boolean, text?: string }) {
  let score = 0.5;

  if (user.hasUsername) score += 0.1;
  if (user.historyLength > 5) score += 0.3;
  if (user.inGroups) score += 0.2;

  if (user.text && user.text.length > 20) score += 0.1;
  if (user.text?.toLowerCase().includes("наложка") || user.text?.toLowerCase().includes("мошенник")) score -= 0.3;

  return Math.max(0, Math.min(1, score));
}

export function getTrustLevel(score: number): 'low' | 'mid' | 'high' {
  if (score < 0.4) return 'low';
  if (score < 0.8) return 'mid';
  return 'high';
}

export function isNewUser(user: any) {
  return !user.hasUsername || user.historyLength < 3;
}