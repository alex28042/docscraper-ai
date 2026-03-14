import type { IHttpClient } from '../interfaces/http-client';
import type { ISitemapParser } from '../interfaces/sitemap-parser';

function extractTagValues(xml: string, tagName: string): string[] {
  const values: string[] = [];
  const regex = new RegExp(`<${tagName}>\\s*(.*?)\\s*</${tagName}>`, 'gs');
  let match = regex.exec(xml);
  while (match !== null) {
    values.push(match[1].trim());
    match = regex.exec(xml);
  }
  return values;
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

function isGzipped(url: string): boolean {
  return url.endsWith('.gz');
}

export class SitemapParser implements ISitemapParser {
  constructor(private readonly httpClient: IHttpClient) {}

  async parse(sitemapUrl: string): Promise<string[]> {
    if (isGzipped(sitemapUrl)) {
      return [];
    }

    let xml: string;
    try {
      xml = await this.httpClient.fetch(sitemapUrl);
    } catch {
      return [];
    }

    if (isSitemapIndex(xml)) {
      return this.parseSitemapIndex(xml);
    }

    return extractTagValues(xml, 'loc');
  }

  private async parseSitemapIndex(xml: string): Promise<string[]> {
    const sitemapUrls = extractTagValues(xml, 'loc');
    const allUrls: string[] = [];

    for (const url of sitemapUrls) {
      if (isGzipped(url)) {
        continue;
      }

      let childXml: string;
      try {
        childXml = await this.httpClient.fetch(url);
      } catch {
        continue;
      }

      const urls = extractTagValues(childXml, 'loc');
      allUrls.push(...urls);
    }

    return allUrls;
  }
}
