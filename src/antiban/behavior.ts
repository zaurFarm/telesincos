export function getTypingDelay(text: string, typingSpeedProfile?: number[]) {
  const base = 1000;
  // If specific profile, use random within profile constraints [min, max] char per minute? 
  // Let's use simple logic: default is 50ms per char.
  let perChar = 50;
  if (typingSpeedProfile && typingSpeedProfile.length === 2) {
     perChar = Math.floor(Math.random() * (typingSpeedProfile[1] - typingSpeedProfile[0]) + typingSpeedProfile[0]);
  }
  return base + text.length * perChar;
}

export function getRandomPause() {
  return 5000 + Math.random() * 15000;
}

export function isWorkingTime() {
  const hour = new Date().getHours();
  return hour >= 9 && hour <= 22;
}

export function decideResponseType(profile?: any) {
  const r = Math.random();
  // We can let behavior profile dictater media frequency eventually
  if (r < 0.6) return 'text';
  if (r < 0.85) return 'voice';
  return 'video';
}