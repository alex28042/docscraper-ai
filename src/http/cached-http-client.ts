import type { IHttpClient } from '../interfaces/http-client';
import type { ICache } from '../interfaces/cache';

/**
 * Decorator that caches HTTP responses.
 * Accepts any ICache implementation via constructor DI.
 *
 * Chain: CachedHttpClient → RetryHttpClient → FetchHttpClient
 */
export class CachedHttpClient implements IHttpClient {
  constructor(
    private readonly inner: IHttpClient,
    private readonly cache: ICache,
  ) {}

  async fetch(
    url: string,
    options?: { allowAnyContent?: boolean; timeoutMs?: number },
  ): Promise<string> {
    const cached = await this.cache.get(url);
    if (cached !== undefined) {
      return cached;
    }

    const data = await this.inner.fetch(url, options);
    await this.cache.set(url, data);
    return data;
  }
}
