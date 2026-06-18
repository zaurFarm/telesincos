export type EnergyLevel = 'excited' | 'neutral' | 'tired' | 'annoyed';

export class EmotionEnergyModel {
  static analyzeConversationEnergy(recentMessages: string[]): EnergyLevel {
    const text = recentMessages.join(' ').toLowerCase();
    
    let ann = 0; // annoyed
    let exc = 0; // excited
    let tir = 0; // tired
    
    // Эвристика для MVP. В проде — LLM classification or small BERT model
    if (text.includes('!') || text.includes('супер') || text.includes('ого') || text.includes('давай')) exc++;
    if (text.includes('?') && (text.includes('почему') || text.includes('долго') || text.includes('брак') || text.includes('нет'))) ann++;
    if (text.includes('потом') || text.includes('посмотрим') || text.includes('устал') || text.includes('подумаю')) tir++;

    if (ann > exc && ann > tir) return 'annoyed';
    if (exc > ann && exc > tir) return 'excited';
    if (tir > ann && tir > exc) return 'tired';
    
    return 'neutral';
  }

  static adjustResponseTone(baseText: string, energy: EnergyLevel): string {
    // В зависимости от энергетики, слегка меняем тон ответа:
    switch (energy) {
      case 'annoyed':
        // Успокаивающий, короткий тон, без воды и смайлов
        return baseText.replace(/!/g, '.').replace(/\)/g, '');
      case 'tired':
        // Мягкий дожим или перенос
        return baseText + ' (если удобно, отложим на завтра)';
      case 'excited':
        // Поддержание динамики
        return baseText + ' 🚀';
      default:
        return baseText;
    }
  }
}
