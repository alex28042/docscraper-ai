declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** A valid URL string */
export type Url = Brand<string, 'Url'>;

/** A URL slug safe for filenames */
export type Slug = Brand<string, 'Slug'>;

/** Duration in milliseconds */
export type Milliseconds = Brand<number, 'Milliseconds'>;

/** Number of requests per second */
export type RequestsPerSecond = Brand<number, 'RequestsPerSecond'>;

/** Maximum concurrency level */
export type ConcurrencyLevel = Brand<number, 'ConcurrencyLevel'>;

/** Depth level for crawling */
export type CrawlDepth = Brand<number, 'CrawlDepth'>;

/** Maximum number of pages */
export type MaxPages = Brand<number, 'MaxPages'>;

/** A regex pattern string */
export type RegexPattern = Brand<string, 'RegexPattern'>;

/** HTML content string */
export type HtmlContent = Brand<string, 'HtmlContent'>;

/** Markdown content string */
export type MarkdownContent = Brand<string, 'MarkdownContent'>;

/** User-Agent header value */
export type UserAgent = Brand<string, 'UserAgent'>;

/** Page title */
export type PageTitle = Brand<string, 'PageTitle'>;

/** Meta description */
export type MetaDescription = Brand<string, 'MetaDescription'>;

/** File system path */
export type FilePath = Brand<string, 'FilePath'>;

/** Directory path */
export type DirectoryPath = Brand<string, 'DirectoryPath'>;

// Brand helper constructors
export function toUrl(value: string): Url {
  return value as Url;
}
export function toSlug(value: string): Slug {
  return value as Slug;
}
export function toMilliseconds(value: number): Milliseconds {
  return value as Milliseconds;
}
export function toRequestsPerSecond(value: number): RequestsPerSecond {
  return value as RequestsPerSecond;
}
export function toConcurrencyLevel(value: number): ConcurrencyLevel {
  return value as ConcurrencyLevel;
}
export function toCrawlDepth(value: number): CrawlDepth {
  return value as CrawlDepth;
}
export function toMaxPages(value: number): MaxPages {
  return value as MaxPages;
}
export function toRegexPattern(value: string): RegexPattern {
  return value as RegexPattern;
}
export function toHtmlContent(value: string): HtmlContent {
  return value as HtmlContent;
}
export function toMarkdownContent(value: string): MarkdownContent {
  return value as MarkdownContent;
}
export function toUserAgent(value: string): UserAgent {
  return value as UserAgent;
}
export function toPageTitle(value: string): PageTitle {
  return value as PageTitle;
}
export function toMetaDescription(value: string): MetaDescription {
  return value as MetaDescription;
}
export function toFilePath(value: string): FilePath {
  return value as FilePath;
}
export function toDirectoryPath(value: string): DirectoryPath {
  return value as DirectoryPath;
}
