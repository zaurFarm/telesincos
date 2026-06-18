export function decidePaymentMethod(trustScore: number) {
  if (trustScore > 0.7) {
    return "high"; // можно предоплату
  }

  if (trustScore > 0.4) {
    return "mid"; // частичная
  }

  return "low"; // при получении / самовывоз
}

export function generatePaymentReply(trustLevel: string) {
  if (trustLevel === "high") {
    return 'Можете сразу перевести на карту, я пока всё подготовлю и оформлю доставку.';
  }
  
  if (trustLevel === "mid") {
    return 'Если сомневаетесь, можно закинуть символическую предоплату (например, 20-30%), остальное при получении или можем оформить доставку до пункта выдачи.';
  }

  return 'Если переживаете по поводу оплаты, можем оформить самовывоз на ТЯК, приедете и заберете лично.';
}

export function maybeOfferPickup(userText: string) {
  if (userText.includes("самовывоз")) {
    return "можно самовывоз, ТЯК Москва рынок";
  }

  return null;
}

export function generateTrustReply() {
  return "если есть вопросы — можешь посмотреть чат, там видно как работаю 👍";
}