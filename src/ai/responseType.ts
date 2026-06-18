export function decideResponseType(stage: string): 'voice' | 'video' | 'text' {
  // If at closing stage, high chance of sending voice to build trust
  if (stage === 'closing' || stage === 'ready') {
    if (Math.random() > 0.5) return 'voice';
  }

  // Random distribution for general chat
  const rand = Math.random();
  if (rand > 0.95) return 'video'; // 5% chance for video note
  if (rand > 0.85) return 'voice'; // 10% chance for voice note

  return 'text'; // 85% chance for text
}
