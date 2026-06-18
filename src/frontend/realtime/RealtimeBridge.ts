import { EventBuffer } from './EventBuffer';
import { FrameScheduler } from './FrameScheduler';

type StateUpdateHandler<T> = (batch: T[]) => void;

export class RealtimeBridge<T> {
  private buffer = new EventBuffer<T>();
  private scheduler: FrameScheduler;
  private onBatchReady: StateUpdateHandler<T>;

  constructor(onBatchReady: StateUpdateHandler<T>, frameRate: number = 100) {
    this.onBatchReady = onBatchReady;
    this.scheduler = new FrameScheduler(() => this.flush(), frameRate);
  }

  dispatch(event: T) {
    this.buffer.push(event);
    this.scheduler.schedule();
  }

  private flush() {
    const items = this.buffer.flush();
    if (items.length > 0) {
      this.onBatchReady(items);
    }
  }
}
