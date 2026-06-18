export interface RiskContext {
  isVipClient: boolean;
  isNewContact: boolean;
  hasDiscount: boolean;
  containsPaymentDetails: boolean;
  intentScore: number;
  trustScore: number;
  // Fraud Signals
  rapidRequests: boolean;
  messageAnomalies: boolean;
}

export class ActionRiskEngine {
  static calculateRisk(ctx: RiskContext): { score: number, level: 'low' | 'medium' | 'high' | 'critical', reason: string[] } {
    let score = 0;
    const outReasons: string[] = [];

    // Contextual Risk: Discount
    if (ctx.hasDiscount) {
      if (ctx.isVipClient) {
        score += 10;
        outReasons.push('Скидка для VIP (Low Risk)');
      } else if (ctx.isNewContact) {
        score += 45;
        outReasons.push('Скидка новому контакту (High Risk)');
      } else {
        score += 30;
        outReasons.push('Обсуждение скидки');
      }
    }

    if (ctx.isNewContact && !ctx.hasDiscount) {
      score += 40;
      outReasons.push('Новый контакт (холодный лид)');
    }

    if (ctx.containsPaymentDetails) {
      score += 50;
      outReasons.push('Реквизиты / Оплата');
    }

    // Fraud Signals
    if (ctx.rapidRequests) {
      score += 35;
      outReasons.push('Аномалия: Спам-запросы (Fraud Signal)');
    }
    
    if (ctx.messageAnomalies) {
      score += 30;
      outReasons.push('Аномалия текста/поведения (Fraud Signal)');
    }

    // Trust mitigates risk
    if (ctx.trustScore > 0.8 && !ctx.rapidRequests) {
      score -= 30; // VIP discount on risk
      outReasons.push('Высокий траст клиента (VIP - снижение риска)');
    }

    // High intent increases risk (more to lose)
    if (ctx.intentScore > 0.8 && ctx.containsPaymentDetails) {
      score += 10;
      outReasons.push('Горячая фаза (цена ошибки высока)');
    }

    // Clip 0-100
    score = Math.max(0, Math.min(100, score));

    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (score >= 80) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 30) level = 'medium';

    return { score, level, reason: outReasons };
  }
}
