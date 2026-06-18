import { connection, hasRedisUrl } from '../../queue/redis.js';

export interface AggregateSnapshot<T> {
  aggregateId: string;
  version: number;
  createdAt: number;
  state: T;
}

export class SnapshotStore {
  static async save<T>(aggregateId: string, snapshot: AggregateSnapshot<T>): Promise<void> {
    if (!hasRedisUrl || process.env.DISABLE_WORKERS) return;
    const key = `snapshot:${aggregateId}`;
    await connection.set(key, JSON.stringify(snapshot));
  }

  static async load<T>(aggregateId: string): Promise<AggregateSnapshot<T> | null> {
    if (!hasRedisUrl || process.env.DISABLE_WORKERS) return null;
    const key = `snapshot:${aggregateId}`;
    const data = await connection.get(key);
    return data ? JSON.parse(data) : null;
  }
}
