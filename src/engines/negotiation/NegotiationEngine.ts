export interface NegotiationContext {
  replySpeedSec: number;
  messageText: string;
  isAskingDelivery: boolean;
  isAskingPrice: boolean;
}

export class NegotiationEngine {
  
  static async analyzeMessage(text: string): Promise<{ hesitation: boolean; fakeBuyer: boolean; intentScore: number; objectionType?: string; counterStrategy?: string }> {
    const txt = text.toLowerCase();
    
    // In Production Enterprise System, this uses an LLM Intent Classifier
    // e.g., const intent = await LLMIntentClassifier.detect(text);
    // Simulating semantic checks instead of simple words
    const semanticTooExpensive = [
      'дорого', 'скидка', 'дороговато', 'нет денег', 'слишком много', 'дорогой', 
      'цены высокие', 'не вписываемся в бюджет', 'бюджет не позволяет', 'нашли дешевле', 'высокая цена'
    ].some(t => txt.includes(t));

    // A real implementation would ensure it doesn't match "у конкурента не дорого"
    const isFalsePositive = txt.includes('не дорого') || txt.includes('почему');

    const isTooExpensive = semanticTooExpensive && !isFalsePositive;

    const hesitationTriggers = ['я подумаю', 'позже', 'может быть', 'пока нет', 'дорого', 'скинь фото', 'посмотрю'];
    const fakeBuyerTriggers = ['просто смотрю', 'ради интереса', 'а че так', 'какая разница', 'ты кто', 'скучно'];
    
    const isHesitating = hesitationTriggers.some(t => txt.includes(t));
    const isFake = fakeBuyerTriggers.some(t => txt.includes(t));

    let intentScore = 0.5;
    if (txt.includes('доставка') || txt.includes('купить') || txt.includes('заберу') || txt.includes('адрес') || txt.includes('куда платить')) {
      intentScore += 0.4;
    }
    if (isHesitating) intentScore -= 0.2;
    if (isFake) intentScore -= 0.4;

    let objectionType;
    let counterStrategy;

    if (isTooExpensive) {
      objectionType = 'цена/дорого (LLM Verified)';
      // Using MarginController to check if we can even offer a discount would happen later
      counterStrategy = 'Предлагаю разбить платеж на 2 части (предоплата + по факту) или зафиксировать скидку при оплате сегодня.';
    }

    return {
      hesitation: isHesitating,
      fakeBuyer: isFake,
      intentScore: Math.max(0, Math.min(1.0, intentScore)),
      objectionType,
      counterStrategy
    };
  }

  static calculateTiming(replySpeedSec: number, intentScore: number): number {
    // Sales Timing Engine:
    // If the user replies instantly (e.g. < 5 sec), we shouldn't respond immediately
    // to avoid looking like a bot.
    // If intent is high, reply moderately fast to keep the hot lead.
    // If hesitation, let them "breathe" before offering a discount.
    
    let delayMs = 0;
    
    if (replySpeedSec < 10) {
      delayMs = 15000 + (Math.random() * 10000); // Wait 15-25 seconds
    } else {
      delayMs = 5000 + (Math.random() * 5000); // 5-10 seconds
    }

    if (intentScore < 0.3) {
      delayMs += 30000; // Lower priority, reply later
    }

    return delayMs;
  }
}
