import { DocScraperError } from './docscraper-error';

/** Thrown when HTML parsing fails */
export class HtmlParseError extends DocScraperError {
  constructor(
    public readonly url: string,
    message?: string,
  ) {
    super(message ?? `Failed to parse HTML from ${url}`);
    this.name = 'HtmlParseError';
  }
}
