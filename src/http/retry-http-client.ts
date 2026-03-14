import type { IHttpClient } from '../interfaces/http-client';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export class RetryHttpClient implements IHttpClient {
  private readonly inner: IHttpClient;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(inner: IHttpClient, options: RetryOptions = {}) {
    this.inner = inner;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 10000;
  }

  async fetch(
    url: string,
    options?: { allowAnyContent?: boolean; timeoutMs?: number },
  ): Promise<string> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.inner.fetch(url, options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private isRetryable(error: Error): boolean {
    // Retry on 5xx server errors
    if (error.message.includes('HTTP 5')) {
      return true;
    }

    // Retry on network errors (no HTTP status code pattern means network-level failure)
    const isHttpError = /HTTP \d/.test(error.message);
    if (!isHttpError) {
      return true;
    }

    // Do not retry 4xx or other HTTP errors
    return false;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt);
    const clampedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    const jitter = Math.random() * clampedDelay * 0.1;
    return clampedDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
