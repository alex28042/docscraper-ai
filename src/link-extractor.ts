import * as cheerio from 'cheerio';

export function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: Set<string> = new Set();
  const base = new URL(baseUrl);

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const resolved = new URL(href, baseUrl);

      // Only keep same-origin HTTP(S) links
      if (resolved.origin !== base.origin) return;
      if (!resolved.protocol.startsWith('http')) return;

      // Strip hash and trailing slash for deduplication
      resolved.hash = '';
      let normalized = resolved.toString();
      if (normalized.endsWith('/') && normalized !== resolved.origin + '/') {
        normalized = normalized.slice(0, -1);
      }

      links.add(normalized);
    } catch {
      // Skip malformed URLs
    }
  });

  return Array.from(links);
}

export function filterLinks(
  links: string[],
  includePatterns: string[],
  excludePatterns: string[],
): string[] {
  let filtered = links;

  if (includePatterns.length > 0) {
    const includeRegexes = includePatterns.map((p) => new RegExp(p));
    filtered = filtered.filter((url) =>
      includeRegexes.some((re) => re.test(url)),
    );
  }

  if (excludePatterns.length > 0) {
    const excludeRegexes = excludePatterns.map((p) => new RegExp(p));
    filtered = filtered.filter(
      (url) => !excludeRegexes.some((re) => re.test(url)),
    );
  }

  return filtered;
}
