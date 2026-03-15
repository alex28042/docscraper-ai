import * as cheerio from 'cheerio';

/**
 * Detects language from HTML document attributes and meta tags.
 * Checks: <html lang>, <meta http-equiv="content-language">, <meta name="language">
 */
export function detectLanguageFromHtml(html: string): string | null {
  const $ = cheerio.load(html);

  const htmlLang = $('html').attr('lang');
  if (htmlLang) return htmlLang.trim().toLowerCase();

  const httpEquivLang = $('meta[http-equiv="content-language"]').attr('content');
  if (httpEquivLang) return httpEquivLang.trim().toLowerCase();

  const metaLang = $('meta[name="language"]').attr('content');
  if (metaLang) return metaLang.trim().toLowerCase();

  return null;
}
