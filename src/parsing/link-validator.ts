import type { IHttpClient } from '../interfaces/http-client';
import type { PageContent, LinkStatus, LinkReport } from '../types';

export interface LinkValidatorOptions {
  checkExternal?: boolean;
  timeoutMs?: number;
}

/** Validate all links found across crawled pages */
export async function validateLinks(
  pages: PageContent[],
  httpClient: IHttpClient,
  options: LinkValidatorOptions = {},
): Promise<LinkReport> {
  const { checkExternal = false } = options;

  // Collect all links and their sources
  const linkMap = new Map<string, Set<string>>();
  const crawledUrls = new Set(pages.map((p) => p.url as string));

  for (const page of pages) {
    for (const link of page.links) {
      const linkStr = link as string;
      if (!linkMap.has(linkStr)) {
        linkMap.set(linkStr, new Set());
      }
      linkMap.get(linkStr)!.add(page.url as string);
    }
  }

  const links: LinkStatus[] = [];

  for (const [url, referencedFrom] of linkMap) {
    let isExternal: boolean;
    try {
      const startHost = new URL(pages[0]?.url ?? '').host;
      isExternal = new URL(url).host !== startHost;
    } catch {
      isExternal = true;
    }

    // Internal links: check against crawled URLs
    if (!isExternal) {
      const isValid = crawledUrls.has(url);
      links.push({
        url,
        isExternal: false,
        referencedFrom: Array.from(referencedFrom),
        isValid,
        error: isValid ? undefined : 'Page not found in crawl results',
      });
      continue;
    }

    // External links: only check if opted in
    if (!checkExternal) {
      links.push({
        url,
        isExternal: true,
        referencedFrom: Array.from(referencedFrom),
        isValid: true, // assume valid when not checking
      });
      continue;
    }

    try {
      await httpClient.fetch(url, { allowAnyContent: true, timeoutMs: options.timeoutMs });
      links.push({
        url,
        statusCode: 200,
        isExternal: true,
        referencedFrom: Array.from(referencedFrom),
        isValid: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      links.push({
        url,
        isExternal: true,
        referencedFrom: Array.from(referencedFrom),
        isValid: false,
        error: message,
      });
    }
  }

  const valid = links.filter((l) => l.isValid).length;
  const broken = links.filter((l) => !l.isValid).length;

  return {
    total: links.length,
    valid,
    broken,
    links,
  };
}
