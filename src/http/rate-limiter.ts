import type { IRateLimiter } from '../interfaces';

export class TokenBucketRateLimiter implements IRateLimiter {
  private lastRequestTime = 0;
  private readonly minIntervalMs: number;

  constructor(requestsPerSecond: number) {
    this.minIntervalMs = requestsPerSecond > 0 ? 1000 / requestsPerSecond : 0;
  }

  async acquire(): Promise<void> {
    if (this.minIntervalMs <= 0) return;

    const elapsed = Date.now() - this.lastRequestTime;
    const waitTime = this.minIntervalMs - elapsed;

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}
