import { describe, it, expect, vi } from 'vitest';
import { RetryHttpClient } from '../../../src/http/retry-http-client';
import type { IHttpClient } from '../../../src/interfaces/http-client';

function createMockClient(responses: Array<string | Error>): IHttpClient {
  let callIndex = 0;
  return {
    async fetch(): Promise<string> {
      const response = responses[callIndex++];
      if (response instanceof Error) throw response;
      return response;
    },
  };
}

describe('RetryHttpClient', () => {
  it('should return result on first success without retrying', async () => {
    const inner = createMockClient(['<html>ok</html>']);
    const client = new RetryHttpClient(inner, { maxRetries: 3, baseDelayMs: 1 });

    const result = await client.fetch('https://example.com');
    expect(result).toBe('<html>ok</html>');
  });

  it('should retry on network errors and succeed', async () => {
    const inner = createMockClient([
      new Error('ECONNRESET'),
      new Error('ETIMEDOUT'),
      '<html>ok</html>',
    ]);
    const client = new RetryHttpClient(inner, { maxRetries: 3, baseDelayMs: 1 });

    const result = await client.fetch('https://example.com');
    expect(result).toBe('<html>ok</html>');
  });

  it('should retry on 5xx errors', async () => {
    const inner = createMockClient([
      new Error('HTTP 500: Internal Server Error'),
      new Error('HTTP 502: Bad Gateway'),
      '<html>ok</html>',
    ]);
    const client = new RetryHttpClient(inner, { maxRetries: 3, baseDelayMs: 1 });

    const result = await client.fetch('https://example.com');
    expect(result).toBe('<html>ok</html>');
  });

  it('should not retry on 4xx errors', async () => {
    const inner = createMockClient([new Error('HTTP 404: Not Found'), '<html>ok</html>']);
    const client = new RetryHttpClient(inner, { maxRetries: 3, baseDelayMs: 1 });

    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should not retry on HTTP 403', async () => {
    const inner = createMockClient([new Error('HTTP 403: Forbidden'), '<html>ok</html>']);
    const client = new RetryHttpClient(inner, { maxRetries: 3, baseDelayMs: 1 });

    await expect(client.fetch('https://example.com')).rejects.toThrow('HTTP 403: Forbidden');
  });

  it('should throw after exhausting all retries', async () => {
    const inner = createMockClient([
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
    ]);
    const client = new RetryHttpClient(inner, { maxRetries: 3, baseDelayMs: 1 });

    await expect(client.fetch('https://example.com')).rejects.toThrow('ECONNRESET');
  });

  it('should use default options when none provided', async () => {
    const inner = createMockClient(['<html>ok</html>']);
    const client = new RetryHttpClient(inner);

    const result = await client.fetch('https://example.com');
    expect(result).toBe('<html>ok</html>');
  });

  it('should pass options through to inner client', async () => {
    const fetchSpy = vi.fn().mockResolvedValue('<html>ok</html>');
    const inner: IHttpClient = { fetch: fetchSpy };
    const client = new RetryHttpClient(inner, { maxRetries: 1, baseDelayMs: 1 });

    await client.fetch('https://example.com', { allowAnyContent: true, timeoutMs: 5000 });

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com', {
      allowAnyContent: true,
      timeoutMs: 5000,
    });
  });

  it('should apply exponential backoff with capped delay', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number) => {
      delays.push(ms ?? 0);
      // Execute immediately for test speed
      if (typeof fn === 'function') fn();
      return originalSetTimeout(() => {}, 0);
    });

    const inner = createMockClient([
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
      '<html>ok</html>',
    ]);
    const client = new RetryHttpClient(inner, {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 500,
    });

    await client.fetch('https://example.com');

    // Delays should be approximately: 100, 200, 400 (all under maxDelay of 500)
    // With jitter (up to 10%), check rough ranges
    expect(delays.length).toBe(3);
    expect(delays[0]).toBeGreaterThanOrEqual(100);
    expect(delays[0]).toBeLessThan(120); // 100 + 10% jitter
    expect(delays[1]).toBeGreaterThanOrEqual(200);
    expect(delays[1]).toBeLessThan(240);
    expect(delays[2]).toBeGreaterThanOrEqual(400);
    expect(delays[2]).toBeLessThan(480);

    vi.restoreAllMocks();
  });

  it('should cap delay at maxDelayMs', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler, ms?: number) => {
      delays.push(ms ?? 0);
      if (typeof fn === 'function') fn();
      return originalSetTimeout(() => {}, 0);
    });

    const inner = createMockClient([
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
      new Error('ECONNRESET'),
      '<html>ok</html>',
    ]);
    const client = new RetryHttpClient(inner, {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 1500,
    });

    await client.fetch('https://example.com');

    // attempt 0: min(1000 * 1, 1500) = 1000
    // attempt 1: min(1000 * 2, 1500) = 1500
    // attempt 2: min(1000 * 4, 1500) = 1500
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(1200);
    expect(delays[1]).toBeGreaterThanOrEqual(1500);
    expect(delays[1]).toBeLessThan(1700);
    expect(delays[2]).toBeGreaterThanOrEqual(1500);
    expect(delays[2]).toBeLessThan(1700);

    vi.restoreAllMocks();
  });
});
