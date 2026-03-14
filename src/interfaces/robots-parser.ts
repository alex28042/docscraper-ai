export interface IRobotsParser {
  isAllowed(url: string): Promise<boolean>;
  getCrawlDelay(): number | null;
  getSitemapUrls(): string[];
}
