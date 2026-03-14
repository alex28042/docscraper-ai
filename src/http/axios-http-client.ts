import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { IHttpClient } from '../interfaces/http-client';
import type { IRateLimiter } from '../interfaces/rate-limiter';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; WebScraperSDK/1.0; +https://github.com/web-scraper-sdk)';

export interface AxiosHttpClientOptions {
  userAgent?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class AxiosHttpClient implements IHttpClient {
  private readonly client: AxiosInstance;
  private readonly rateLimiter: IRateLimiter;
  private readonly defaultTimeoutMs: number;

  constructor(rateLimiter: IRateLimiter, options: AxiosHttpClientOptions = {}) {
    this.rateLimiter = rateLimiter;
    this.defaultTimeoutMs = options.timeoutMs ?? 10_000;

    this.client = axios.create({
      headers: {
        'User-Agent': options.userAgent ?? DEFAULT_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        ...options.headers,
      },
      maxRedirects: 10,
      responseType: 'text',
    });
  }

  async fetch(
    url: string,
    options?: { allowAnyContent?: boolean; timeoutMs?: number },
  ): Promise<string> {
    await this.rateLimiter.acquire();

    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;

    const response = await this.client.get<string>(url, {
      timeout: timeoutMs,
    });

    if (!options?.allowAnyContent) {
      const contentType = (response.headers['content-type'] as string) ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    }

    return response.data;
  }
}
