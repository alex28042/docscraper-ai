/** Base error for all docscraper-ai errors */
export class DocScraperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocScraperError';
  }
}
