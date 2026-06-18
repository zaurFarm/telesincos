// autonomous protection layer

export class SimilarityAnalyzer {
  static getTrigrams(text: string): Set<string> {
    const cleanStr = text.toLowerCase().replace(/[^a-zа-я0-9\s]/g, '');
    const tokens = cleanStr.split(/\s+/).filter(w => w.length > 0);
    const trigrams = new Set<string>();
    
    for (let i = 0; i < tokens.length - 2; i++) {
        trigrams.add(`${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`);
    }
    return trigrams;
  }

  static calculateSimilarity(text1: string, text2: string): number {
    const set1 = this.getTrigrams(text1);
    const set2 = this.getTrigrams(text2);
    
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let intersectionSize = 0;
    set1.forEach(trigram => {
        if (set2.has(trigram)) {
            intersectionSize++;
        }
    });
    
    return intersectionSize / Math.max(set1.size, set2.size);
  }
}

export class BrandPatternDetector {
  static detect(text: string): string[] {
    const patterns = [
      /MegaShop/gi,
      /TechStore/gi,
      /у нас в канале/gi,
      /как писали ранее/gi,
      /наши подписчики/gi,
      /наш магазин/gi,
    ];
    
    const matches: string[] = [];
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) matches.push(...m);
    });
    
    return matches;
  }
}
