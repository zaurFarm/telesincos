import { EnergyLevel } from '../personality/EmotionEnergyModel.js';
import { RiskContext } from './ActionRiskEngine.js';

export type DealStage = 'awareness' | 'consideration' | 'negotiation' | 'closing' | 'won' | 'lost';

export interface SystemState {
  client: { intentScore: number; status: string; trustScore: number };
  market: { demandLevel: 'high' | 'normal' | 'low' };
  risk: { score: number; level: 'low' | 'medium' | 'high' | 'critical' };
  dealStage: DealStage;
  emotion: EnergyLevel;
}

export class DecisionGraph {
  
  /**
   * The overarching Decision Graph that combines Client State, Risk, Emotion, and Market State
   * to determine the overarching tactical action for this interaction.
   */
  static evaluateNextAction(state: SystemState): { action: 'push' | 'pause' | 'handoff' | 'nurture', logic: string } {
    
    // Critical Risk always overrides and requires Human Handoff
    if (state.risk.level === 'critical') {
      return { action: 'handoff', logic: 'Критический риск. Требуется живой оператор.' };
    }

    // High emotion / annoyed -> Pause and de-escalate OR handoff
    if (state.emotion === 'annoyed') {
      if (state.client.trustScore < 0.4) {
        return { action: 'handoff', logic: 'Клиент раздражен и траст низкий. Риск срыва сделки.' };
      }
      return { action: 'pause', logic: 'Клиент раздражен. Выдерживаем паузу, смягчаем тон.' };
    }

    // High intent in closing phase -> Push (Close the deal)
    if (state.dealStage === 'negotiation' || state.dealStage === 'closing') {
      if (state.client.intentScore > 0.7 && state.risk.level === 'low') {
        return { action: 'push', logic: 'Высокий интент на этапе закрытия, риск низкий. Дожимаем (Push).' };
      }
    }

    // Consideration Phase + Low Intent -> Nurture
    if (state.dealStage === 'awareness' || state.dealStage === 'consideration') {
      if (state.client.intentScore < 0.4) {
        return { action: 'nurture', logic: 'Клиент на ранней стадии с низким интентом. Вовлекаем (Nurture).' };
      }
      return { action: 'nurture', logic: 'Продолжаем подогрев, даем факты без прямого дожима.' };
    }

    // Default action if nothing triggers a drastic change
    return { action: 'pause', logic: 'Нет четких сигналов для пуша. Сохраняем нейтралитет.' };
  }
}
