import * as cheerio from 'cheerio';
import type { IHtmlParser, ParsedPage } from '../interfaces';

const DEFAULT_REMOVE_SELECTORS = [
  'script',
  'style',
  'nav',
  'footer',
  'header',
  'iframe',
  'noscript',
  '.sidebar',
  '.navigation',
  '.nav',
  '.footer',
  '.header',
  '.cookie-banner',
  '.ad',
  '.ads',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
];

const DEFAULT_CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.content',
  '.main-content',
  '.post-content',
  '.article-content',
  '.documentation',
  '.docs-content',
  '#content',
  '#main',
];

export interface CheerioHtmlParserOptions {
  removeSelectors?: string[];
  contentSelectors?: string[];
}

export class CheerioHtmlParser implements IHtmlParser {
  private readonly removeSelectors: string[];
  private readonly contentSelectors: string[];

  constructor(options: CheerioHtmlParserOptions = {}) {
    this.removeSelectors = options.removeSelectors ?? DEFAULT_REMOVE_SELECTORS;
    this.contentSelectors = options.contentSelectors ?? DEFAULT_CONTENT_SELECTORS;
  }

  parse(html: string, url: string): ParsedPage {
    const $ = cheerio.load(html, { xml: false } as cheerio.CheerioOptions);

    const title =
      $('title').first().text().trim() || $('h1').first().text().trim() || new URL(url).pathname;

    const description =
      $('meta[name="description"]').attr('content')?.trim() ??
      $('meta[property="og:description"]').attr('content')?.trim() ??
      '';

    $(this.removeSelectors.join(', ')).remove();

    let mainHtml = '';
    for (const selector of this.contentSelectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        mainHtml = el.html() ?? '';
        break;
      }
    }

    if (!mainHtml) {
      mainHtml = $('body').html() ?? '';
    }

    return { title, description, mainHtml };
  }
}
