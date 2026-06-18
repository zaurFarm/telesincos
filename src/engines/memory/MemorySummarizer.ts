export interface ExtractedFacts {
  budget?: string;
  preferredDelivery?: string;
  objections: string[];
  preferredProducts: string[];
}

export interface MemoryTier {
  tier: 'hot' | 'warm' | 'cold';
  content: string[] | ExtractedFacts | string; 
  /* 
    hot: recent raw messages
    warm: ExtractedFacts
    cold: semantic embeddings / archive string
  */
}

export class MemorySummarizer {
  
  static async extractFacts(historyToSummarize: string[]): Promise<ExtractedFacts> {
    // В реальном проде: вызов LLM с жестко ограниченным system prompt для JSON экстракции.
    // Пример промпта: "Извлеки бюджет, предпочитаемую доставку, возражения и товары из диалога."
    
    // Mock extraction for now (simulating structured data extraction):
    const text = historyToSummarize.join(' ').toLowerCase();
    
    const facts: ExtractedFacts = {
      objections: [],
      preferredProducts: []
    };

    if (text.includes('дорого') || text.includes('скидка')) facts.objections.push('Цена (дорого)');
    if (text.includes('сдэк') || text.includes('почта')) facts.preferredDelivery = 'СДЭК / Почта';
    if (text.includes('руб') || text.includes('тыс')) facts.budget = 'Понятие бюджета упомянуто';
    if (text.includes('hqd') || text.includes('одноразки')) facts.preferredProducts.push('Одноразки');

    return facts;
  }

  static async rollingContextWindow(fullHistory: string[], maxHotWindow: number = 10): Promise<{ hot: string[], warm: ExtractedFacts }> {
    if (fullHistory.length <= maxHotWindow) {
      // Если текста мало, всё в HOT tier, фактов пока нет
      return { hot: fullHistory, warm: { objections: [], preferredProducts: [] } };
    }

    const overage = fullHistory.length - maxHotWindow;
    const elementsToCompress = fullHistory.slice(0, overage + 2); // Берем с небольшим перехлестом
    const activeHotContext = fullHistory.slice(overage + 2);

    const extractedFacts = await this.extractFacts(elementsToCompress);

    return { hot: activeHotContext, warm: extractedFacts };
  }
}
