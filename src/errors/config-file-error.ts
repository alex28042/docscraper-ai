import { DocScraperError } from './docscraper-error';

/** Thrown when a config file is invalid */
export class ConfigFileError extends DocScraperError {
  constructor(
    public readonly filePath: string,
    message?: string,
  ) {
    super(message ?? `Invalid config file: ${filePath}`);
    this.name = 'ConfigFileError';
  }
}
