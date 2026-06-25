export function humanizeText(text: string, profile?: any) {
  let t = text;

  // Profile configuration (with defaults)
  const isLower = profile?.slangLevel > 0.5 ? 0.8 : 0.5;
  const noPunctuation = profile?.slangLevel > 0.5 ? 0.6 : 0.3;
  const emojiUsage = profile?.emojiUsage !== undefined ? profile.emojiUsage : 0.2;

  // убираем "идеальность"
  if (Math.random() < noPunctuation) {
    t = t.replace(/\./g, '');
  }

  // иногда убираем запятые
  if (Math.random() < noPunctuation) {
    t = t.replace(/,/g, '');
  }

  // маленькие буквы
  if (Math.random() < isLower) {
    t = t.toLowerCase();
  }

  // добавляем разговорные окончания
  const endings = ["", " ок", " норм", " смотри", " если что"];
  if (Math.random() < (profile?.slangLevel || 0.3)) {
      t += endings[Math.floor(Math.random() * endings.length)];
  }

  if (Math.random() < emojiUsage) {
      const em = ["🔥", "🤝", "👌", "💡", "👀"];
      t += " " + em[Math.floor(Math.random() * em.length)];
  }

  return t;
}

export function splitMessage(text: string) {
  if (text.length < 40) return [text];

  const parts = text.split(/[,\.]/);

  return parts.filter(p => p.trim().length > 0);
}

const bannedPhrases = [
  "здравствуйте",
  "могу предложить",
  "высокое качество",
  "выгодное предложение"
];

export function cleanBotText(text: string) {
  if (!text || typeof text !== 'string') return text || '';
  let t = text;

  for (const phrase of bannedPhrases) {
    t = t.replace(new RegExp(phrase, 'gi'), "");
  }

  return t.trim();
}