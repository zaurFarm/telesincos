import { DealStage } from './DecisionGraph.js';

export class SalesTimelineModel {
  
  /**
   * Defines macro-timing for the sales lifecycle (when to push, when to wait, when to remind)
   */
  static determineTimelineAction(dealStage: DealStage, hoursSinceLastContact: number, intentScore: number): { recommendedAction: 'send_followup' | 'wait' | 'drop', reason: string } {
    
    // If they just messaged us, we wait for the conversation to unfold organically.
    if (hoursSinceLastContact < 1) {
      return { recommendedAction: 'wait', reason: 'Диалог активен.' };
    }

    switch (dealStage) {
      case 'awareness':
        // Not very warm yet
        if (hoursSinceLastContact > 72) { // 3 days
           return { recommendedAction: 'send_followup', reason: 'Спящий лид (3 дня). Мягкий пинг (новая позиция/завоз).' };
        }
        break;

      case 'consideration':
        // Thinking about it
        if (hoursSinceLastContact > 24 && hoursSinceLastContact < 72) {
          return { recommendedAction: 'send_followup', reason: 'Был интерес, пропал на 24ч. Спросить не нужна ли помощь определиться.' };
        }
        if (hoursSinceLastContact > 168) { // 7 days
          return { recommendedAction: 'drop', reason: 'Пропал на неделю, переводим в холодную базу (Lost).' };
        }
        break;

      case 'negotiation':
      case 'closing':
        // Left on read right at the finish line
        if (hoursSinceLastContact > 4 && hoursSinceLastContact < 24) {
          if (intentScore > 0.8) {
             return { recommendedAction: 'send_followup', reason: 'Застрял на финальном этапе. Фолл-ап с триггером urgency (наличие товара).' };
          }
        }
        break;
        
      case 'won':
      case 'lost':
        return { recommendedAction: 'wait', reason: 'Сделка завершена.' };
    }

    return { recommendedAction: 'wait', reason: 'Тайминг еще не подошел.' };
  }
}
