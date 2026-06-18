export function applyStyle(text: string, style: any) {
  if (!style) return text;
  let result = text;

  // Если обычно пишет коротко, стараемся обрезать (в идеале это делается на уровне промпта, но тут как fall-back)
  if (style.avg_length < 40) {
    const parts = result.split('.');
    if (parts.length > 2) {
      result = parts.slice(0, 2).join('.') + '.';
    }
  }

  // эмодзи
  if (style.emoji_usage > 0.3) {
    if (!result.includes('👌') && !result.includes('👍')) {
      const emojis = ['👌', '👍', '😊', '🙌'];
      result += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
    }
  }

  // мягкий стиль
  if (style.punctuation_style === 'soft') {
    result = result.replace(/\./g, '...');
  }

  // сленг
  if (style.slang_level > 0.3) {
    result = result.replace('можно', 'можно в целом').replace('хорошо', 'окей').replace('здравствуйте', 'привет');
  }

  return result;
}
