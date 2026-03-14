import type { IHttpClient } from '../interfaces/http-client';
import type { IRobotsParser } from '../interfaces/robots-parser';

interface ParsedRobots {
  allowRules: string[];
  disallowRules: string[];
  crawlDelay: number | null;
  sitemapUrls: string[];
}

function extractDomain(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

function matchesUserAgent(agentLine: string, botName: string): boolean {
  const agent = agentLine.toLowerCase().trim();
  return agent === '*' || agent.includes(botName.toLowerCase());
}

function pathMatchesRule(urlPath: string, rule: string): boolean {
  if (rule === '' || rule === '/') {
    return rule === '/';
  }

  if (rule.endsWith('$')) {
    const pattern = rule.slice(0, -1);
    return urlPath === pattern;
  }

  if (rule.includes('*')) {
    const parts = rule.split('*');
    let remaining = urlPath;
    for (const part of parts) {
      const idx = remaining.indexOf(part);
      if (idx === -1) {
        return false;
      }
      remaining = remaining.slice(idx + part.length);
    }
    return true;
  }

  return urlPath.startsWith(rule);
}

function parseRobotsText(text: string, botName: string): ParsedRobots {
  const lines = text.split('\n');
  const result: ParsedRobots = {
    allowRules: [],
    disallowRules: [],
    crawlDelay: null,
    sitemapUrls: [],
  };

  let currentAgentMatches = false;
  let foundSpecificMatch = false;
  const wildcardRules: ParsedRobots = {
    allowRules: [],
    disallowRules: [],
    crawlDelay: null,
    sitemapUrls: [],
  };
  let currentIsWildcard = false;

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim();
    if (line === '') {
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      continue;
    }

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'sitemap') {
      result.sitemapUrls.push(value);
      continue;
    }

    if (directive === 'user-agent') {
      currentIsWildcard = value.trim() === '*';
      currentAgentMatches = matchesUserAgent(value, botName);
      if (currentAgentMatches && !currentIsWildcard) {
        foundSpecificMatch = true;
      }
      continue;
    }

    if (directive === 'disallow' && currentAgentMatches) {
      if (currentIsWildcard && !foundSpecificMatch) {
        wildcardRules.disallowRules.push(value);
      } else if (!currentIsWildcard) {
        result.disallowRules.push(value);
      }
    }

    if (directive === 'allow' && currentAgentMatches) {
      if (currentIsWildcard && !foundSpecificMatch) {
        wildcardRules.allowRules.push(value);
      } else if (!currentIsWildcard) {
        result.allowRules.push(value);
      }
    }

    if (directive === 'crawl-delay' && currentAgentMatches) {
      const delay = parseFloat(value);
      if (!Number.isNaN(delay)) {
        if (currentIsWildcard && !foundSpecificMatch) {
          wildcardRules.crawlDelay = delay;
        } else if (!currentIsWildcard) {
          result.crawlDelay = delay;
        }
      }
    }
  }

  if (!foundSpecificMatch) {
    result.allowRules = wildcardRules.allowRules;
    result.disallowRules = wildcardRules.disallowRules;
    result.crawlDelay = wildcardRules.crawlDelay;
  }

  return result;
}

export class RobotsParser implements IRobotsParser {
  private readonly cache = new Map<string, ParsedRobots>();
  private readonly botName: string;

  constructor(
    private readonly httpClient: IHttpClient,
    botName = 'docscraper',
  ) {
    this.botName = botName;
  }

  async isAllowed(url: string): Promise<boolean> {
    const parsed = await this.getParsedRobots(url);
    const urlPath = new URL(url).pathname;

    for (const rule of parsed.allowRules) {
      if (pathMatchesRule(urlPath, rule)) {
        return true;
      }
    }

    for (const rule of parsed.disallowRules) {
      if (pathMatchesRule(urlPath, rule)) {
        return false;
      }
    }

    return true;
  }

  getCrawlDelay(): number | null {
    if (this.cache.size === 0) {
      return null;
    }
    const firstEntry = this.cache.values().next().value;
    return firstEntry?.crawlDelay ?? null;
  }

  getSitemapUrls(): string[] {
    const urls: string[] = [];
    for (const parsed of this.cache.values()) {
      urls.push(...parsed.sitemapUrls);
    }
    return urls;
  }

  private async getParsedRobots(url: string): Promise<ParsedRobots> {
    const domain = extractDomain(url);

    const cached = this.cache.get(domain);
    if (cached !== undefined) {
      return cached;
    }

    const robotsUrl = `${domain}/robots.txt`;
    let text: string;
    try {
      text = await this.httpClient.fetch(robotsUrl);
    } catch {
      const empty: ParsedRobots = {
        allowRules: [],
        disallowRules: [],
        crawlDelay: null,
        sitemapUrls: [],
      };
      this.cache.set(domain, empty);
      return empty;
    }

    const parsed = parseRobotsText(text, this.botName);
    this.cache.set(domain, parsed);
    return parsed;
  }
}
