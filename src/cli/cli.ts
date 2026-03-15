#!/usr/bin/env node

import { executeDiscover } from './commands/discover';
import { executeScrape } from './commands/scrape';
import { executeDiff } from './commands/diff';

function printUsage(): void {
  console.log(`
Usage:
  skill-tree discover <topic> [--max-results N]
  skill-tree scrape <url> [<url>...] [options]
  skill-tree diff <previous.json> <current.json>

Commands:
  discover    Search for official documentation URLs for a topic
  scrape      Scrape URLs and output markdown content
  diff        Compare two crawl results and show changes

Discover options:
  --max-results <n>   Max URLs to return (default: 4)

Scrape options:
  --output <dir>      Output directory for .md files (default: stdout as JSON)
  --max-chars <n>     Skip pages over N characters (default: 80000)
  --concurrency <n>   Max concurrent requests (default: 3)
  --resume <file>     Resume a previous crawl from state file
  --validate-links    Validate all links after crawling

Diff options:
  <previous.json>     Path to previous crawl result JSON
  <current.json>      Path to current crawl result JSON

Examples:
  skill-tree discover "supabase auth"
  skill-tree scrape https://docs.stripe.com/api --output /tmp/raw
  skill-tree scrape https://hono.dev/docs https://hono.dev/api --output ./raw
  skill-tree diff previous.json current.json
`);
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
      await executeDiscover(args.slice(1));
      break;
    case 'scrape':
      await executeScrape(args.slice(1));
      break;
    case 'diff':
      await executeDiff(args.slice(1));
      break;
    default:
      if (command.startsWith('http')) {
        await executeScrape(args);
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
