export function addCTA(text: string): string {
  const variants = [
    'пиши в лс',
    'если нужно — напиши',
    'могу отложить',
    'для заказа обращайтесь в лс',
    'наличие ограничено, пишите',
    'жду в личке, подскажу по вкусам',
    'вопросы в лс'
  ];

  const cta = variants[Math.floor(Math.random() * variants.length)];
  return `${text}\n\n👉 @менеджер (напиши мне)\n${cta}`;
}
