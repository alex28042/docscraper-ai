import * as fs from 'fs';
import * as path from 'path';
import { createDefaultCrawler } from '../../factories';
import { StderrLogger } from '../../interfaces/logger';
import { toRequestsPerSecond, toMilliseconds, toConcurrencyLevel } from '../../types';

export async function executeScrape(args: string[]): Promise<void> {
  const urls: string[] = [];
  let output = '';
  let maxChars = 80_000;
  let concurrency = 3;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') {
      output = args[++i];
    } else if (args[i] === '--max-chars') {
      maxChars = parseInt(args[++i], 10);
    } else if (args[i] === '--concurrency') {
      concurrency = parseInt(args[++i], 10);
    } else if (args[i].startsWith('http')) {
      urls.push(args[i]);
    }
  }

  if (urls.length === 0) {
    console.error('Error: no URLs provided for scrape');
    process.exit(1);
  }

  const logger = new StderrLogger();
  const crawler = await createDefaultCrawler(
    {
      rateLimit: toRequestsPerSecond(3),
      timeoutMs: toMilliseconds(15_000),
      concurrency: toConcurrencyLevel(concurrency),
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

  if (output) {
    fs.mkdirSync(output, { recursive: true });

    for (const page of pages) {
      if (page.skipped) continue;

      const slug =
        new URL(page.url).pathname
          .replace(/^\/+|\/+$/g, '')
          .replace(/\//g, '--')
          .replace(/[^a-z0-9-]/gi, '-')
          .replace(/-+/g, '-') || 'index';

      const filePath = path.join(output, `${slug}.md`);
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
      path.join(output, '_manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    process.stderr.write(
      `\nDone! ${pages.filter((p) => !p.skipped).length}/${urls.length} pages scraped to ${output}\n`,
    );
  } else {
    console.log(JSON.stringify(pages, null, 2));
  }
}
