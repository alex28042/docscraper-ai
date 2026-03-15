import * as cheerio from 'cheerio';
import type { ApiEndpoint, ApiParam, HttpMethod } from '../types';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ENDPOINT_REGEX = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s<"']+)/g;

/** Extract API endpoint definitions from HTML documentation */
export function extractApiEndpoints(html: string): ApiEndpoint[] {
  const $ = cheerio.load(html);
  const text = $.text();
  const endpoints: ApiEndpoint[] = [];
  const seen = new Set<string>();

  // Extract from text patterns like "GET /api/users"
  let match: RegExpExecArray | null;
  while ((match = ENDPOINT_REGEX.exec(text)) !== null) {
    const method = match[1] as HttpMethod;
    const path = match[2];
    const key = `${method} ${path}`;
    if (seen.has(key)) continue;
    seen.add(key);

    endpoints.push({
      method,
      path,
      params: [],
    });
  }

  // Extract from code blocks
  $('code, pre').each((_, el) => {
    const code = $(el).text();
    let codeMatch: RegExpExecArray | null;
    const codeRegex = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s<"']+)/g;
    while ((codeMatch = codeRegex.exec(code)) !== null) {
      const method = codeMatch[1] as HttpMethod;
      const path = codeMatch[2];
      const key = `${method} ${path}`;
      if (seen.has(key)) continue;
      seen.add(key);

      endpoints.push({
        method,
        path,
        params: [],
        codeExample: code.trim(),
      });
    }
  });

  // Try to extract parameters from tables near endpoints
  $('table').each((_, table) => {
    const headers = $(table)
      .find('th')
      .map((__, th) => $(th).text().toLowerCase().trim())
      .get();

    const nameIdx = headers.findIndex((h) => h === 'name' || h === 'parameter');
    const typeIdx = headers.findIndex((h) => h === 'type');
    const requiredIdx = headers.findIndex((h) => h === 'required');
    const descIdx = headers.findIndex(
      (h) => h === 'description' || h === 'desc' || h === 'details',
    );

    if (nameIdx === -1) return;

    const params: ApiParam[] = [];
    $(table)
      .find('tbody tr')
      .each((__, row) => {
        const cells = $(row)
          .find('td')
          .map((___, td) => $(td).text().trim())
          .get();
        if (cells[nameIdx]) {
          params.push({
            name: cells[nameIdx],
            type: cells[typeIdx] ?? 'string',
            required: requiredIdx !== -1 ? cells[requiredIdx]?.toLowerCase() === 'yes' : false,
            description: cells[descIdx] ?? '',
          });
        }
      });

    if (params.length > 0) {
      // Find the closest preceding endpoint reference
      const prevText = $(table).prevAll().text();
      for (const m of HTTP_METHODS) {
        const regex = new RegExp(`${m}\\s+(/[^\\s]+)`, 'g');
        let last: RegExpExecArray | null = null;
        let r: RegExpExecArray | null;
        while ((r = regex.exec(prevText)) !== null) {
          last = r;
        }
        if (last) {
          const key = `${m} ${last[1]}`;
          const endpoint = endpoints.find((e) => `${e.method} ${e.path}` === key);
          if (endpoint && endpoint.params.length === 0) {
            endpoint.params = params;
          }
          break;
        }
      }
    }
  });

  return endpoints;
}
