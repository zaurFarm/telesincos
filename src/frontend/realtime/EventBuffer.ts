export class EventBuffer<T> {
  private buffer: T[] = [];

  push(item: T) {
    this.buffer.push(item);
  }

  flush(): T[] {
    const items = [...this.buffer];
    this.buffer = [];
    return items;
  }
  
  get size() {
    return this.buffer.length;
  }
}
