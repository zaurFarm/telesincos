export function shouldLearn(text: string) {
  if (!text || text.length < 10) return false;

  const lower = text.toLowerCase();

  // ❌ Garbage
  if (lower.includes('привет') && text.length < 15) return false;
  if (lower.includes('ок') || lower === 'да') return false;

  // ❌ Spam
  if (lower.includes('подписывайся') || lower.includes('http') || lower.includes('t.me')) return false;

  // ✅ Dialog triggers
  if (lower.includes('цена') ||
      lower.includes('сколько') ||
      lower.includes('есть') ||
      lower.includes('можно') ||
      lower.includes('отдашь') ||
      lower.includes('заберу')) {
    return true;
  }

  // Fallback: learn if it's long enough
  return text.length > 25;
}
