import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export interface AppContext {
  tenantId: string;
  traceId: string;
  jobId?: string;
  actor?: 'user' | 'system';
  createdAt: number;
}

export const contextStorage = new AsyncLocalStorage<AppContext>();

export function createContext(tenantId: string, actor: 'user' | 'system' = 'system'): AppContext {
  return {
    tenantId,
    traceId: randomUUID(),
    actor,
    createdAt: Date.now()
  };
}

export function runWithContext<T>(context: AppContext, fn: () => Promise<T>): Promise<T> {
  return contextStorage.run(context, fn);
}

export function getContext(): AppContext | undefined {
  return contextStorage.getStore();
}

export function getTenantId(): string | undefined {
  return contextStorage.getStore()?.tenantId;
}

export function getTraceId(): string | undefined {
  return contextStorage.getStore()?.traceId;
}
