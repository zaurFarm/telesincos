export class FrameScheduler {
  private renderCallback: () => void;
  private animationFrameId: number | null = null;
  private throttleMs: number;
  private lastRenderTime: number = 0;

  constructor(renderCallback: () => void, throttleMs: number = 100) {
    this.renderCallback = renderCallback;
    this.throttleMs = throttleMs;
  }

  schedule() {
    if (this.animationFrameId === null) {
      if (typeof requestAnimationFrame !== 'undefined') {
          this.animationFrameId = requestAnimationFrame(this.onFrame);
      } else {
          // Node fallback
          setTimeout(this.onFrameNode, this.throttleMs);
      }
    }
  }

  private onFrame = (timestamp: number) => {
    this.animationFrameId = null;
    
    if (timestamp - this.lastRenderTime >= this.throttleMs) {
      this.renderCallback();
      this.lastRenderTime = timestamp;
    } else {
      this.animationFrameId = requestAnimationFrame(this.onFrame);
    }
  };

  private onFrameNode = () => {
    this.animationFrameId = null;
    this.renderCallback();
  };
}
