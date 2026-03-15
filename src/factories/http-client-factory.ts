import type { IHttpClient } from '../interfaces/http-client';
import type { IRateLimiter } from '../interfaces/rate-limiter';
import { FetchHttpClient } from '../http/fetch-http-client';

export type HttpClientType = 'fetch' | 'axios' | 'undici' | 'playwright';

export interface HttpClientOptions {
  userAgent?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class HttpClientFactory {
  private readonly type: HttpClientType;
  private readonly options: HttpClientOptions;

  constructor(type: HttpClientType = 'fetch', options: HttpClientOptions = {}) {
    this.type = type;
    this.options = options;
  }

  async create(rateLimiter: IRateLimiter): Promise<IHttpClient> {
    switch (this.type) {
      case 'axios': {
        const { AxiosHttpClient } = await import('../http/axios-http-client');
        return new AxiosHttpClient(rateLimiter, this.options);
      }
      case 'undici': {
        const { UndiciHttpClient } = await import('../http/undici-http-client');
        return new UndiciHttpClient(rateLimiter, this.options);
      }
      case 'playwright': {
        const { PlaywrightHttpClient } = await import('../http/playwright-http-client');
        return new PlaywrightHttpClient();
      }
      case 'fetch':
      default:
        return new FetchHttpClient(rateLimiter, this.options);
    }
  }
}
