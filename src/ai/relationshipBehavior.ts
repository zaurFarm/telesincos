import { getRelation } from './relationship.js';

export function decideStrategy(userId: string) {
  const rel = getRelation(userId);

  switch (rel.type) {
    case 'new':
      return 'soft';      // аккуратно знакомимся
    case 'warm':
      return 'normal';    // обычная продажа
    case 'trusted':
      return 'close';     // можно дожимать
    case 'buyer':
      return 'upsell';    // допродажа
    case 'risky':
      return 'defensive'; // аккуратно, без лишнего
    case 'ghost':
      return 'revive';    // возродить диалог
    default:
      return 'soft';
  }
}
