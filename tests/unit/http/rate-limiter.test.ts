import { describe, it, expect } from 'vitest';
import { TokenBucketRateLimiter } from '../../../src/http/rate-limiter';

describe('TokenBucketRateLimiter', () => {
  it('should resolve immediately when rate limit is 0 (disabled)', async () => {
    const limiter = new TokenBucketRateLimiter(0);
    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('should enforce minimum interval between calls', async () => {
    const rps = 10; // 100ms interval
    const limiter = new TokenBucketRateLimiter(rps);

    await limiter.acquire();
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(80); // allow some tolerance
  });

  it('should not delay first call', async () => {
    const limiter = new TokenBucketRateLimiter(1);
    const start = Date.now();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('should space out multiple rapid calls', async () => {
    const rps = 20; // 50ms interval
    const limiter = new TokenBucketRateLimiter(rps);

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // 2 intervals needed for 3 calls = ~100ms
    expect(elapsed).toBeGreaterThanOrEqual(80);
  });
});
