export function generateVariants(type: string): string[] {
  switch (type) {
    case 'wholesale':
      return [
        `опт есть\nкакие объемы нужны?`,
        `можем сделать партию\nсколько штук интересует?`,
        `есть в наличии под опт\nкакой объем?`
      ];

    case 'reseller':
      return [
        `для постоянников есть норм условия\nчто именно берешь обычно?`,
        `можем работать на постоянке\nкакие позиции нужны?`,
        `дроп/перепродажа ок\nчто ищешь?`
      ];

    case 'retail':
      return [
        `в розницу есть\nчто именно нужно?`,
        `в наличии\nкакие вкусы ищешь?`,
        `есть\nчто подсказать?`
      ];

    case 'risky':
      return [
        `не актуально`,
        `закончились`,
        `пока нет в наличии`
      ];

    case 'curious':
    default:
      return [
        `есть\nсколько нужно?`,
        `в наличии\nчто берешь?`,
        `могу подсказать\nчто ищешь?`
      ];
  }
}

export function pickVariant(variants: string[]): string {
  return variants[Math.floor(Math.random() * variants.length)];
}

export const priceReplies = [
  "1500",
  "1500 ₽",
  "примерно 1500",
  "1500 где то",
  "около 1500"
];
