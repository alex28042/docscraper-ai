import { DocScraperError } from './docscraper-error';

/** Thrown when crawl state cannot be loaded or saved */
export class CrawlStateError extends DocScraperError {
  constructor(
    public readonly operation: 'load' | 'save' | 'clear',
    message?: string,
  ) {
    super(message ?? `Failed to ${operation} crawl state`);
    this.name = 'CrawlStateError';
  }
}
