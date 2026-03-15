import { DocScraperError } from './docscraper-error';

/** Thrown when a required dependency is not installed */
export class MissingDependencyError extends DocScraperError {
  constructor(
    public readonly dependency: string,
    public readonly installCommand: string,
  ) {
    super(`${dependency} is not installed. Install it with: ${installCommand}`);
    this.name = 'MissingDependencyError';
  }
}
