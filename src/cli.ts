#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Crawler } from './crawler';
import { Discoverer } from './discoverer';

function printUsage(): void {
  console.log(`
Usage:
  skill-tree discover <topic> [--max-results N]
  skill-tree scrape <url> [<url>...] [options]

Commands:
  discover    Search for official documentation URLs for a topic
  scrape      Scrape URLs and output markdown content

Discover options:
  --max-results <n>   Max URLs to return (default: 4)

Scrape options:
  --output <dir>      Output directory for .md files (default: stdout as JSON)
  --max-chars <n>     Skip pages over N characters (default: 80000)
  --concurrency <n>   Max concurrent requests (default: 3)

Examples:
  skill-tree discover "supabase auth"
  skill-tree scrape https://docs.stripe.com/api --output /tmp/raw
  skill-tree scrape https://hono.dev/docs https://hono.dev/api --output ./raw
`);
}

async function cmdDiscover(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('Error: missing topic for discover');
    process.exit(1);
  }

  const topic = args[0];
  let maxResults = 4;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--max-results') {
      maxResults = parseInt(args[++i], 10);
    }
  }

  process.stderr.write(`Discovering sources for: ${topic}\n`);

  const discoverer = new Discoverer();
  const results = await discoverer.discover(topic, maxResults);

  if (results.length === 0) {
    console.error('No official sources found.');
    process.exit(1);
  }

  // Output as JSON for easy parsing by the skill
  console.log(JSON.stringify(results, null, 2));
}

async function cmdScrape(args: string[]): Promise<void> {
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

  const crawler = new Crawler({ rateLimit: 3, timeoutMs: 15_000, concurrency });

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
    // Write individual .md files to output directory
    fs.mkdirSync(output, { recursive: true });

    for (const page of pages) {
      if (page.skipped) continue;

      const slug = new URL(page.url).pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\//g, '--')
        .replace(/[^a-z0-9-]/gi, '-')
        .replace(/-+/g, '-')
        || 'index';

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

    // Write manifest
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
    process.stderr.write(`\nDone! ${pages.filter((p) => !p.skipped).length}/${urls.length} pages scraped to ${output}\n`);
  } else {
    // Output as JSON to stdout
    console.log(JSON.stringify(pages, null, 2));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'discover':
      await cmdDiscover(args.slice(1));
      break;
    case 'scrape':
      await cmdScrape(args.slice(1));
      break;
    default:
      // Legacy mode: treat first arg as URL if it starts with http
      if (command.startsWith('http')) {
        await cmdScrape(args);
      } else {
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
      }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
