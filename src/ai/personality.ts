export type Mood = 'neutral' | 'friendly' | 'lazy' | 'busy' | 'playful';

export interface PersonalityState {
  mood: Mood;
  lastActive: number;
  messageCount: number;
}

const states = new Map<string, PersonalityState>();
const MAP_LIMIT = 10000;

function cleanupMap() {
  if (states.size > MAP_LIMIT) {
    // Удаляем самые старые (опираемся на lastActive)
    const sorted = [...states.entries()].sort((a, b) => a[1].lastActive - b[1].lastActive);
    // Удаляем половину самых старых
    for (let i = 0; i < sorted.length / 2; i++) {
        states.delete(sorted[i][0]);
    }
  }
}

export function getPersonality(userId: string): PersonalityState {
  cleanupMap();
  if (!states.has(userId)) {
    states.set(userId, {
      mood: 'neutral',
      lastActive: Date.now(),
      messageCount: 0
    });
  }
  return states.get(userId)!;
}

export function updateMood(userId: string, text: string) {
  const state = getPersonality(userId);
  const textLower = text.toLowerCase();

  // Simple logic for mood changes based on keywords
  if (textLower.includes('?') || textLower.includes('спасибо')) state.mood = 'friendly';
  if (text.length < 10) state.mood = 'lazy';
  if (textLower.includes('цена') || textLower.includes('сколько') || textLower.includes('быстро')) state.mood = 'busy';

  state.messageCount++;
  state.lastActive = Date.now();

  // Memory scaling - get friendly over time
  if (state.messageCount > 5) {
    state.mood = 'friendly';
  }
  if (state.messageCount > 10) {
    state.mood = 'playful';
  }
}
