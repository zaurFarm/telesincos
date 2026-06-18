import { randomUUID } from 'crypto';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  step: string;
}

export function createSpan(step: string, parent?: Span | null): Span {
  return {
    traceId: parent?.traceId || randomUUID(),
    spanId: randomUUID(),
    parentSpanId: parent?.spanId || null,
    step
  };
}
