const VAPE_KEYWORDS = [
  'вейп', 'vape', 'жидкост', 'под', 'pod', 'hqd', 'puffmi', 'waka',
  'elf bar', 'elfbar', 'снюс', 'одноразк', 'электронн', 'сигарет',
  'испаритель', 'атомайзер', 'солевой никотин', 'опт', 'табак'
];

export function analyzeGroup(title?: string, description?: string) {
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();
  const isRelevant = VAPE_KEYWORDS.some(k => text.includes(k));
  return {
    allowAds: !text.includes('запрещена реклама'),
    hasModeration: text.includes('админ') || text.includes('правил'),
    risky: text.includes('бан') || text.includes('блок'),
    isRelevant
  };
}
