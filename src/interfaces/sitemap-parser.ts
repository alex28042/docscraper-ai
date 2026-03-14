export interface ISitemapParser {
  parse(sitemapUrl: string): Promise<string[]>;
}
