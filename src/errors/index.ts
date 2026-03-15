/** Base error for all docscraper-ai errors */
export class DocScraperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocScraperError';
  }
}

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

/** Thrown when crawl configuration is invalid */
export class ConfigValidationError extends DocScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

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

/** Thrown when diff inputs are invalid */
export class DiffInputError extends DocScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'DiffInputError';
  }
}
