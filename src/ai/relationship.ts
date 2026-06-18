export type RelationType =
  | 'new'
  | 'warm'
  | 'trusted'
  | 'buyer'
  | 'risky'
  | 'ghost';

export interface RelationState {
  type: RelationType;
  messages: number;
  lastSeen: number;
  trustScore: number;
}

const relations = new Map<string, RelationState>();
const MAP_LIMIT = 10000;

function cleanupRelations() {
  if (relations.size > MAP_LIMIT) {
    const sorted = [...relations.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen);
    for (let i = 0; i < sorted.length / 2; i++) {
        relations.delete(sorted[i][0]);
    }
  }
}

export function getRelation(userId: string): RelationState {
  cleanupRelations();
  if (!relations.has(userId)) {
    relations.set(userId, {
      type: 'new',
      messages: 0,
      lastSeen: Date.now(),
      trustScore: 0.5
    });
  }
  return relations.get(userId)!;
}

export function updateRelation(userId: string, text: string) {
  const r = getRelation(userId);
  const textLower = text.toLowerCase();

  r.messages++;
  r.lastSeen = Date.now();

  // Trust boosting
  if (text.length > 20) r.trustScore += 0.05;
  if (textLower.includes('ок') || textLower.includes('беру') || textLower.includes('цена') || textLower.includes('давай')) {
    r.trustScore += 0.1;
  }

  // Trust lowering
  if (textLower.includes('гарантии') || textLower.includes('кидалово') || textLower.includes('как работает')) {
    r.trustScore -= 0.2;
  }

  // Bound the trust score safely between 0 and 1
  r.trustScore = Math.max(0, Math.min(1, r.trustScore));

  // Classification Logic
  if (r.trustScore > 0.8) r.type = 'trusted';
  else if (r.trustScore > 0.6) r.type = 'warm';
  else if (r.trustScore < 0.3) r.type = 'risky';

  // Make them a ghost if inactive for 24h+ and not a buyer
  if (Date.now() - r.lastSeen > 86400000 && r.type !== 'buyer') {
    r.type = 'ghost';
  }
}
