export class RuntimeInspector {
  static inspect(runtime: any) {
    if (runtime.memoryPressure > 0.9) {
      throw new Error('Runtime overload');
    }
    if (runtime.eventBacklog > 10000) {
      throw new Error('Event congestion');
    }
  }
}
