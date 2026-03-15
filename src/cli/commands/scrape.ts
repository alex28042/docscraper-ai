import * as fs from 'fs';
import * as path from 'path';
import { createDefaultCrawler } from '../../factories';
import { StderrLogger } from '../../interfaces/logger';
import {
  toRequestsPerSecond,
  toMilliseconds,
  toConcurrencyLevel,
  toMaxPages,
  toCrawlDepth,
} from '../../types';
import { loadConfig, mergeConfig } from '../config';
import type { CliConfig } from '../config';
import { FsCrawlStateStore } from '../../crawling/fs-crawl-state';
import { validateLinks } from '../../parsing/link-validator';

export async function executeScrape(args: string[]): Promise<void> {
  const urls: string[] = [];
  let output = '';
  let maxChars = 80_000;
  let concurrency = 3;
  let resumeFile = '';
  let shouldValidateLinks = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') {
      output = args[++i];
    } else if (args[i] === '--max-chars') {
      maxChars = parseInt(args[++i], 10);
    } else if (args[i] === '--concurrency') {
      concurrency = parseInt(args[++i], 10);
    } else if (args[i] === '--resume') {
      resumeFile = args[++i];
    } else if (args[i] === '--validate-links') {
      shouldValidateLinks = true;
    } else if (args[i].startsWith('http')) {
      urls.push(args[i]);
    }
  }

  if (urls.length === 0) {
    console.error('Error: no URLs provided for scrape');
    process.exit(1);
  }

  // Feature 6: Config file support
  const fileConfig = loadConfig();
  const cliFlags: Partial<CliConfig> = {};
  if (concurrency !== 3) cliFlags.concurrency = concurrency;
  if (output) cliFlags.output = output;
  const config = mergeConfig(fileConfig, cliFlags);

  const effectiveConcurrency = config.concurrency ?? concurrency;

  const logger = new StderrLogger();
  const crawler = await createDefaultCrawler(
    {
      rateLimit: toRequestsPerSecond(config.rateLimit ?? 3),
      timeoutMs: toMilliseconds(config.timeout ?? 15_000),
      concurrency: toConcurrencyLevel(effectiveConcurrency),
    },
    logger,
  );

  interface ScrapedPage {
    url: string;
    title: string;
    description: string;
    markdown: string;
    charCount: number;
    skipped: boolean;
    error?: string;
  }

  const pages: ScrapedPage[] = [];

  // Feature 4: Resumable crawl support
  if (resumeFile && urls.length === 1) {
    const stateStore = new FsCrawlStateStore(resumeFile);
    const result = await crawler.crawl(urls[0], {
      stateStore,
      maxPages: config.maxPages ? toMaxPages(config.maxPages) : undefined,
      maxDepth: config.maxDepth ? toCrawlDepth(config.maxDepth) : undefined,
    });

    for (const page of result.pages) {
      if (page.markdown.length > maxChars) {
        pages.push({
          url: page.url,
          title: page.title,
          description: page.description,
          markdown: '',
          charCount: page.markdown.length,
          skipped: true,
        });
      } else {
        pages.push({
          url: page.url,
          title: page.title,
          description: page.description,
          markdown: page.markdown,
          charCount: page.markdown.length,
          skipped: false,
        });
      }
    }

    // Feature 7: Link validation
    if (shouldValidateLinks) {
      process.stderr.write('\nValidating links...\n');
      const report = await validateLinks(result.pages, {
        fetch: async (url: string) => {
          try {
            const resp = await globalThis.fetch(url, { method: 'HEAD' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return '';
          } catch (err) {
            throw err;
          }
        },
      });
      process.stderr.write(
        `Links: ${report.valid} valid, ${report.broken} broken of ${report.total} total\n`,
      );
      if (report.broken > 0) {
        for (const link of report.links.filter((l: { isValid: boolean }) => !l.isValid)) {
          process.stderr.write(`  [broken] ${link.url} (${link.error})\n`);
        }
      }
    }
  } else {
    for (const url of urls) {
      process.stderr.write(`[${pages.length + 1}/${urls.length}] Scraping: ${url}\n`);

      try {
        const page = await crawler.scrapePage(url);

        if (page.markdown.length > maxChars) {
          process.stderr.write(`  Skipped (${page.markdown.length} chars > ${maxChars} limit)\n`);
          pages.push({
            url,
            title: page.title,
            description: page.description,
            markdown: '',
            charCount: page.markdown.length,
            skipped: true,
          });
          continue;
        }

        pages.push({
          url,
          title: page.title,
          description: page.description,
          markdown: page.markdown,
          charCount: page.markdown.length,
          skipped: false,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`  Error: ${message}\n`);
        pages.push({
          url,
          title: '',
          description: '',
          markdown: '',
          charCount: 0,
          skipped: true,
          error: message,
        });
      }
    }
  }

  const effectiveOutput = config.output ?? output;

  if (effectiveOutput) {
    fs.mkdirSync(effectiveOutput, { recursive: true });

    for (const page of pages) {
      if (page.skipped) continue;

      const slug =
        new URL(page.url).pathname
          .replace(/^\/+|\/+$/g, '')
          .replace(/\//g, '--')
          .replace(/[^a-z0-9-]/gi, '-')
          .replace(/-+/g, '-') || 'index';

      const filePath = path.join(effectiveOutput, `${slug}.md`);
      const content = [
        `# ${page.title}`,
        `> Source: ${page.url}`,
        `> ${page.charCount} characters`,
        '',
        page.markdown,
      ].join('\n');

      fs.writeFileSync(filePath, content, 'utf-8');
      process.stderr.write(`  Wrote: ${filePath}\n`);
    }

    const manifest = pages.map((p) => ({
      url: p.url,
      title: p.title,
      chars: p.charCount,
      skipped: p.skipped,
      error: p.error,
    }));
    fs.writeFileSync(
      path.join(effectiveOutput, '_manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    process.stderr.write(
      `\nDone! ${pages.filter((p) => !p.skipped).length}/${urls.length} pages scraped to ${effectiveOutput}\n`,
    );
  } else {
    console.log(JSON.stringify(pages, null, 2));
  }
}
