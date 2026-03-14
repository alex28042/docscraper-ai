import * as cheerio from 'cheerio';
import type { IHttpClient } from '../interfaces/http-client';
import type { ISearchEngine, SearchResult } from '../interfaces/search-engine';

export class DuckDuckGoSearchEngine implements ISearchEngine {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(query: string): Promise<SearchResult[]> {
    const encoded = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

    const html = await this.httpClient.fetch(url, { allowAnyContent: true });
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    $('.result').each((_, el) => {
      const linkEl = $(el).find('.result__a').first();
      const snippetEl = $(el).find('.result__snippet').first();

      let href = linkEl.attr('href') ?? '';
      const title = linkEl.text().trim();
      const snippet = snippetEl.text().trim();

      if (!href || !title) return;

      try {
        if (href.includes('uddg=')) {
          const match = href.match(/uddg=([^&]+)/);
          if (match) {
            href = decodeURIComponent(match[1]);
          }
        }
        new URL(href);
        results.push({ url: href, title, snippet });
      } catch {
        // Skip malformed URLs
      }
    });

    return results;
  }
}
