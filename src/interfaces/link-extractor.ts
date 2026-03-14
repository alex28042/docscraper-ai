export interface ILinkExtractor {
  extract(html: string, baseUrl: string): string[];
}
