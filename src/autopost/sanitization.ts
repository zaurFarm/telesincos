// STAGE 22 - Autonomous Content Sanitization Layer

export class SourceLeakDetector {
  static detect(text: string): string[] {
    const leaks: string[] = [];

    const patterns = [
      /@[A-Za-z0-9_]+/gi,
      /t\.me\/[A-Za-z0-9_]+/gi,
      /telegram\.me\/[A-Za-z0-9_]+/gi,
      /http[s]?:\/\/\S+/gi, // Any generic links left over
      /\+\d{7,15}/g,       // Phone numbers
      /wa\.me\/\S+/gi,
    ];

    for (const p of patterns) {
      const found = text.match(p);
      if (found) {
        leaks.push(...found);
      }
    }

    return leaks;
  }

  static wipeLeaks(text: string): string {
    let safe = text;
    const patterns = [
      /@[A-Za-z0-9_]+/gi,
      /t\.me\/[A-Za-z0-9_]+/gi,
      /telegram\.me\/[A-Za-z0-9_]+/gi,
      /http[s]?:\/\/\S+/gi,
      /\+\d{7,15}/g,
      /wa\.me\/\S+/gi,
    ];

    for (const p of patterns) {
      safe = safe.replace(p, '');
    }
    
    return safe.replace(/\s{2,}/g, ' ').trim();
  }
}

export class AdDetector {
  // Returns ad score. High score -> looks like spam or competitor promotion
  static evaluate(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();
    
    const triggerPhrases = [
      'подписывайся',
      'переходи по ссылке',
      'в нашем канале',
      'жми сюда',
      'заходи к нам',
      'скидка 100%',
      'казино',
      'ставки',
      'только у нас'
    ];

    for (const phrase of triggerPhrases) {
      if (lower.includes(phrase)) score += 20;
    }

    // Emoji density
    const emojis = text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
    if (emojis.length > 5) score += 10;
    if (emojis.length > 10) score += 20;

    // ALL CAPS density
    const capsCount = (text.match(/[A-ZА-Я]/g) || []).length;
    const letterCount = (text.match(/[a-zA-Zа-яА-Я]/g) || []).length;
    if (letterCount > 20 && (capsCount / letterCount) > 0.4) {
      score += 25; // Screaming text
    }

    return score;
  }
}

import { SimilarityAnalyzer, BrandPatternDetector } from './protection.js';

export class SemanticRiskScorer {
  static evaluate(originalOutput: string, rewritten: string): { score: number, reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const text = rewritten;

    // 1. Source Leak Check
    const leaks = SourceLeakDetector.detect(text);
    if (leaks.length > 0) {
      score += leaks.length * 30; // +30 for every leaked asset
      reasons.push(`Source leak detected: ${leaks.join(', ')}`);
    }

    // 1.5. Brand Leak Check
    const brandLeaks = BrandPatternDetector.detect(text);
    if (brandLeaks.length > 0) {
      score += brandLeaks.length * 30;
      reasons.push(`Brand or competitor pattern detected: ${brandLeaks.join(', ')}`);
    }

    // 2. Ad/Spam Check
    const adScore = AdDetector.evaluate(text);
    if (adScore > 10) {
      score += adScore;
      reasons.push(`Ad / Spam probability is high (ad score: ${adScore})`);
    }

    // 3. Length safety
    if (text.length < 10) {
      score += 40;
      reasons.push("Text is suspiciously short.");
    }

    // 4. Broken markup
    if (text.includes("```") || text.includes("**")) {
      score += 15;
      reasons.push("Markdown escaping leaked into text.");
    }

    // 5. Similarity check
    const similarity = SimilarityAnalyzer.calculateSimilarity(originalOutput, text);
    if (similarity > 0.4) {
      score += Math.floor(similarity * 100);
      reasons.push(`Semantic similarity is too high (${(similarity * 100).toFixed(1)}%). Too close to original.`);
    }

    return { score, reasons };
  }
}

export class ContentSanitizer {
  static process(text: string): string {
    // Basic automatic sanitization before scoring
    let clean = text;
    // Wipe leaks just in case the LLM failed
    clean = SourceLeakDetector.wipeLeaks(clean);
    return clean;
  }
}

export class PolicyValidator {
  static async validate(originalText: string, rewritten: string): Promise<{ sanitized: string, riskScore: number, reasons: string[], isSafe: boolean }> {
    // Clean up obvious leaks the LLM kept
    const sanitized = ContentSanitizer.process(rewritten);
    
    // Score the cleaned version AGAINST original text
    const risk = SemanticRiskScorer.evaluate(originalText, sanitized);

    // 0-40 -> SAFE
    // 40+ -> DANGEROUS
    
    const isSafe = risk.score < 40;

    return {
      sanitized,
      riskScore: risk.score,
      reasons: risk.reasons,
      isSafe
    };
  }
}
