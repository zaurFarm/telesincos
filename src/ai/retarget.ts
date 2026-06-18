import { ClientType } from './classifier.js';

export function getRetargetMessage(type: ClientType, daysPassed: number): string {
  if (daysPassed === 1) {
    switch (type) {
      case 'wholesale':
        return 'если что, могу по объемам подвинуться';
      case 'reseller':
        return 'кстати, появились новые позиции\nмогу скинуть прайс';
      case 'retail':
        return 'если запутаешься — напиши, помогу выбрать';
      case 'curious':
        return 'есть интересная модель\nхочешь глянешь?';
      case 'risky':
        return ''; // Don't retarget risky
      default:
        return 'слушай, ты там смотрел вообще или уже не актуально?';
    }
  } else if (daysPassed >= 2) {
    if (type === 'risky') return '';
    return 'ты в итоге что решил брать?';
  }
  return '';
}

export function getUpsellMessage(type: ClientType): string {
  switch (type) {
    case 'wholesale':
      return 'можно взять тестовую партию сейчас\nпотом больше если зайдет';
    case 'reseller':
      return 'к нему лучше сразу расходники взять\nразница реально чувствуется';
    case 'retail':
      return 'если хочешь максимум выжать — есть вариант помощнее';
    case 'risky':
      return '';
    case 'curious':
    default:
      return 'кстати, если что — к нему лучше сразу жидкость взять норм\nа то обычные быстро надоедают\n\nтебе какие вкусы вообще заходят?';
  }
}
