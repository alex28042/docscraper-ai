import { DocScraperError } from './docscraper-error';

/** Thrown when diff inputs are invalid */
export class DiffInputError extends DocScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'DiffInputError';
  }
}
