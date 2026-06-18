import { FeedItem } from './FeedComposer';

export interface FeedGroup {
  id: string;
  type: FeedItem['type'];
  priority: number;
  items: FeedItem[];
  title: string;
  latestTimestamp: number;
}

export class FeedGroupingEngine {
  static DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  static groupItems(items: FeedItem[]): FeedGroup[] {
    const groups: Map<string, FeedGroup> = new Map();

    const sortedItems = [...items].sort((a, b) => a.timestamp - b.timestamp);

    for (const item of sortedItems) {
      // Group by deal if present, else by event type
      const groupKey = item.dealId ? `deal_${item.dealId}` : `type_${item.title}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          type: item.type,
          priority: item.priority,
          items: [item],
          title: item.dealId ? `Deal ${item.dealId} Updates` : item.title,
          latestTimestamp: item.timestamp
        });
      } else {
        const group = groups.get(groupKey)!;
        // Only group if within timeframe
        if (item.timestamp - group.latestTimestamp <= this.DEDUP_WINDOW_MS) {
          group.items.push(item);
          group.priority = Math.max(group.priority, item.priority);
          group.latestTimestamp = item.timestamp;
          if (item.type === 'alert') group.type = 'alert';
        } else {
           // Create new group for same key if gap is too large
           const newKey = `${groupKey}_${crypto.randomUUID()}`;
           groups.set(newKey, {
              id: newKey,
              type: item.type,
              priority: item.priority,
              items: [item],
              title: item.dealId ? `Deal ${item.dealId} Updates` : item.title,
              latestTimestamp: item.timestamp
           });
        }
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.priority - a.priority);
  }
}
