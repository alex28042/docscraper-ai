import { DocScraperError } from './docscraper-error';

/** Thrown when crawl configuration is invalid */
export class ConfigValidationError extends DocScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}
