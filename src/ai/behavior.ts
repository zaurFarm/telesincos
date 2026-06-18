import { getPersonality } from './personality.js';

export function decideBehavior(userId: string) {
  const state = getPersonality(userId);

  // Randomly ignore sometimes for realism (15% chance to skip)
  if (Math.random() > 0.85) {
    return { action: 'ignore', delay: 0 };
  }

  // Decide delay based on mood
  let delay = 0;
  if (state.mood === 'lazy') delay = 15000 + Math.random() * 5000;
  if (state.mood === 'busy') delay = 10000 + Math.random() * 3000;
  if (state.mood === 'playful') delay = 2000 + Math.random() * 1000;
  
  // Default human delay (typing speed simulation)
  if (delay === 0) delay = Math.random() * 4000 + 2000;

  return {
    action: 'reply',
    delay
  };
}
