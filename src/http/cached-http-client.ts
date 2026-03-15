import type { IHttpClient } from '../interfaces/http-client';
import type { ICache } from '../interfaces/cache';

/**
 * Decorator that caches HTTP responses.
 * Wraps any IHttpClient — chain with RetryHttpClient for resilient cached requests.
 *
 * Example: CachedHttpClient → RetryHttpClient → FetchHttpClient
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
    const entry = this.cache.get(url);
    if (entry) {
      return entry.data;
    }

    const data = await this.inner.fetch(url, options);
    this.cache.set(url, data);
    return data;
  }
}
