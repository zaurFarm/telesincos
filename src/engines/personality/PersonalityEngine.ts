export class PersonalityEngine {
  
  static humanizePass(generatedText: string): string {
    let text = generatedText.toLowerCase();

    // Anti-corporate filter: Strip overly polite / robot phrasing
    const corporatePhrases = [
      { rx: /здравствуйте,?/g, repl: 'привет,' },
      { rx: /данный товар/g, repl: 'он' },
      { rx: /доступен для заказа/g, repl: 'есть в наличии' },
      { rx: /вас интересует/g, repl: 'тебе нужен' },
      { rx: /если у вас есть вопросы/g, repl: 'если что,' },
      { rx: /с уважением/g, repl: '' },
      { rx: /является/g, repl: 'это' },
      { rx: /добрый день,?/g, repl: 'привет,' },
      { rx: /пожалуйста,/g, repl: '' }
    ];

    for (const rule of corporatePhrases) {
      text = text.replace(rule.rx, rule.repl);
    }

    // Force lower case start and remove trailing dots for telegram style
    text = text.trim();
    if (text.endsWith('.')) {
      text = text.slice(0, -1);
    }

    // Combine split sentences if they are too formal
    text = text.split('. ').join('\\n');

    return text.trim();
  }

  static async aiStyleValidator(text: string): Promise<{ passed: boolean, fixedText: string }> {
    const fixed = this.humanizePass(text);
    
    // Very basic validation - if length is over 200 chars, it's probably too bot-like
    if (fixed.length > 200) {
      // For now, just truncate or we'd ask LLM to rewrite.
      // In production, trigger an LLM prompt: "Rewrite this strictly to 5 words max, Telegram style."
      return { passed: false, fixedText: fixed.substring(0, 150) + '...' };
    }

    return { passed: true, fixedText: fixed };
  }
}
