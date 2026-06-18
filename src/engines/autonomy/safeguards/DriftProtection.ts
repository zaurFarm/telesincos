export class DriftProtection {
  static validate(change: number) {
    if (Math.abs(change) > 0.15) {
      throw new Error('Policy drift exceeded');
    }
  }
}
