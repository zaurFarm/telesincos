export interface Character {
  id: string;
  name: string;
  tone: string;
  style: string;
  emojiLevel: number;
  voice: 'female_soft' | 'female_confident' | 'male_casual';
  niche: string;
}

export const characters: Record<string, Character> = {
  vape_girl_1: {
    id: 'vape_girl_1',
    name: 'Алина',
    tone: 'дружелюбный, легкий флирт',
    style: 'короткие сообщения, без сложных слов',
    emojiLevel: 2,
    voice: 'female_soft',
    niche: 'вейпы'
  },
  manager_opt: {
    id: 'manager_opt',
    name: 'Алексей',
    tone: 'деловой, экспертный',
    style: 'конкретный, по факту',
    emojiLevel: 0,
    voice: 'male_casual',
    niche: 'вейпы опт'
  }
};
