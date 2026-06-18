export interface RuntimeEvent {
  priority: number;
  [key: string]: any;
}

export class EventBackpressure {
  static filter(events: RuntimeEvent[]) {
    return events.filter(e => e.priority > 50);
  }
}
