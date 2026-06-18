export function analyzeStyle(messages: string[]) {
  const total = messages.length;
  if (total === 0) return null;

  const avgLength = messages.reduce((a, m) => a + m.length, 0) / total;

  const emojiCount = messages.filter(m => /[\u{1F600}-\u{1F6FF}]/u.test(m)).length;

  const punctuation = messages.filter(m => m.includes('...')).length;

  return {
    avgLength,
    emojiUsage: emojiCount / total,
    punctuationStyle: punctuation > total * 0.3 ? 'soft' : 'normal',
    slangLevel: messages.filter(m => m.includes('блин') || m.includes('чел') || m.toLowerCase().includes('бро')).length / total
  };
}
