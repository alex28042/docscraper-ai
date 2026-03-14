import * as cheerio from 'cheerio';

export interface ParsedPage {
  title: string;
  description: string;
  mainHtml: string;
}

/** Selectors for elements to remove before extracting content */
const REMOVE_SELECTORS = [
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

/** Selectors to try for main content, in priority order */
const CONTENT_SELECTORS = [
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

export function parsePage(html: string, url: string): ParsedPage {
  const $ = cheerio.load(html, { xml: false } as cheerio.CheerioOptions);

  // Extract metadata
  const title =
    $('title').first().text().trim() ||
    $('h1').first().text().trim() ||
    new URL(url).pathname;

  const description =
    $('meta[name="description"]').attr('content')?.trim() ??
    $('meta[property="og:description"]').attr('content')?.trim() ??
    '';

  // Remove noise elements
  $(REMOVE_SELECTORS.join(', ')).remove();

  // Find main content area
  let mainHtml = '';
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length > 0) {
      mainHtml = el.html() ?? '';
      break;
    }
  }

  // Fallback to body
  if (!mainHtml) {
    mainHtml = $('body').html() ?? '';
  }

  return { title, description, mainHtml };
}
