import * as cheerio from 'cheerio';
import type { IMetadataExtractor } from '../interfaces/metadata-extractor';
import type { PageMetadata } from '../types';

export class CheerioMetadataExtractor implements IMetadataExtractor {
  extract(html: string, _url: string): PageMetadata {
    const $ = cheerio.load(html);

    const getMeta = (name: string): string | undefined => {
      const content =
        $(`meta[name="${name}"]`).attr('content') ??
        $(`meta[property="${name}"]`).attr('content') ??
        $(`meta[http-equiv="${name}"]`).attr('content');
      return content || undefined;
    };

    const canonical = $('link[rel="canonical"]').attr('href') || undefined;
    const language =
      $('html').attr('lang') || getMeta('content-language') || getMeta('language') || undefined;

    const lastModified =
      getMeta('last-modified') ??
      getMeta('article:modified_time') ??
      getMeta('dateModified') ??
      undefined;

    const deprecated =
      getMeta('robots')?.includes('noindex') === true ||
      $('[class*="deprecat"], [class*="Deprecat"], [id*="deprecat"]').length > 0 ||
      $('body').text().toLowerCase().includes('this page is deprecated');

    const deprecationMessage = deprecated
      ? $('[class*="deprecat"], [class*="Deprecat"]').first().text().trim() || undefined
      : undefined;

    return {
      lastModified,
      author: getMeta('author'),
      canonicalUrl: canonical,
      ogTitle: getMeta('og:title'),
      ogDescription: getMeta('og:description'),
      ogImage: getMeta('og:image'),
      language,
      version: getMeta('version') ?? getMeta('docsearch:version'),
      deprecated,
      deprecationMessage,
    };
  }
}
