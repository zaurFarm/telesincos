import { ClientType } from './classifier.js';

export function buildSmartReply(type: ClientType): string {
  switch (type) {
    case 'wholesale':
      return `опт есть  
какие объемы нужны?`;

    case 'reseller':
      return `для постоянников есть норм условия  
что именно берешь обычно?`;

    case 'retail':
      return `в розницу есть  
что именно нужно?`;

    case 'risky':
      return `не актуально`;

    case 'curious':
    default:
      return `есть  
сколько нужно?`;
  }
}
