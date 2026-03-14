import { describe, it, expect } from 'vitest';
import { SemaphoreConcurrencyLimiter } from '../../../src/http/concurrency-limiter';

describe('SemaphoreConcurrencyLimiter', () => {
  it('should allow up to maxConcurrency tasks simultaneously', async () => {
    const limiter = new SemaphoreConcurrencyLimiter(2);
    let running = 0;
    let maxRunning = 0;

    const task = () =>
      limiter.run(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((r) => setTimeout(r, 50));
        running--;
        return 'done';
      });

    await Promise.all([task(), task(), task(), task()]);

    expect(maxRunning).toBe(2);
  });

  it('should return the value from the function', async () => {
    const limiter = new SemaphoreConcurrencyLimiter(1);
    const result = await limiter.run(async () => 42);
    expect(result).toBe(42);
  });

  it('should propagate errors', async () => {
    const limiter = new SemaphoreConcurrencyLimiter(1);
    await expect(
      limiter.run(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('should release slot on error so subsequent tasks run', async () => {
    const limiter = new SemaphoreConcurrencyLimiter(1);

    await expect(
      limiter.run(async () => {
        throw new Error('fail');
      }),
    ).rejects.toThrow();

    const result = await limiter.run(async () => 'ok');
    expect(result).toBe('ok');
  });
});
