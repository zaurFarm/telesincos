export type ClientType =
  | 'wholesale'
  | 'retail'
  | 'reseller'
  | 'curious'
  | 'risky';

export function detectClientType(text: string): ClientType {
  const t = text.toLowerCase();

  if (t.includes('опт') || t.includes('партия') || t.includes('коробк')) return 'wholesale';
  if (t.includes('постоянно') || t.includes('перепрода') || t.includes('дроп')) return 'reseller';
  if (t.match(/\d+\s?(шт|штук)/) || t.includes('один') || t.includes('пару')) return 'retail';
  if (t.includes('гарант') || t.includes('схема') || t.includes('провер') || t.includes('мент') || t.includes('адрес') || t.includes('где стоишь')) return 'risky';

  return 'curious';
}
