export function getLeadTier(score: number) {
  // Score is now 0-100 instead of 0-1, adapting to 0-100 implementation.
  if (score > 75) return 'HOT';
  if (score > 50) return 'WARM';
  if (score > 30) return 'COLD';
  return 'TRASH';
}

export function getAutoStrategy(score: number) {
  if (score > 75) {
    return {
      mode: 'close',
      pressure: 'high',
      delay: 0
    };
  }

  if (score > 50) {
    return {
      mode: 'nurture',
      pressure: 'medium',
      delay: 2000
    };
  }

  if (score > 30) {
    return {
      mode: 'soft',
      pressure: 'low',
      delay: 5000
    };
  }

  return {
    mode: 'ignore',
    pressure: 'none',
    delay: 0
  };
}
