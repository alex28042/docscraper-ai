import { DocScraperError } from './docscraper-error';

/** Thrown when an HTTP request fails */
export class HttpFetchError extends DocScraperError {
  constructor(
    public readonly url: string,
    public readonly statusCode?: number,
    message?: string,
  ) {
    super(message ?? `Failed to fetch ${url}${statusCode ? ` (HTTP ${statusCode})` : ''}`);
    this.name = 'HttpFetchError';
  }
}
