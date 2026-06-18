export function humanizeStyle(text: string, mood: string) {
  let result = text;

  if (mood === 'friendly') {
    result += Math.random() > 0.5 ? ' 🙂' : '';
  }

  if (mood === 'lazy') {
    // Remove periods at the end of sentences
    result = result.replace(/\./g, '');
    result = result.toLowerCase();
  }

  if (mood === 'playful') {
    result = result.replace(/да/gi, 'ага');
    if (Math.random() > 0.7) {
      result += ' 😅';
    }
  }

  return result;
}
