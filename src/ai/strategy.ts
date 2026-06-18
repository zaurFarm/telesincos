export type Strategy =
  | 'hook'
  | 'clarify'
  | 'close'
  | 'push'
  | 'soft_exit'
  | 'filter'
  | 'delay';

export function decideStrategy(text: string, context: string): Strategy {
  const t = text.toLowerCase();

  if (t.includes('гарант') || t.includes('схема') || t.includes('провер') || t.includes('мент') || t.includes('адрес') || t.includes('где стоишь')) return 'filter';
  if (t.includes('прям щас') || t.includes('срочно') || t.includes('быстрее')) return 'delay';
  if (t.includes('цена') || t.includes('сколько') || t.includes('почем')) return 'clarify';
  if (t.includes('беру') || t.includes('давай') || t.includes('оформляем') || t.includes('куда кидать')) return 'close';
  if (t.includes('подумаю') || t.includes('позже') || t.includes('дорого')) return 'push';
  if (t.length < 10) return 'hook';

  return 'clarify';
}
