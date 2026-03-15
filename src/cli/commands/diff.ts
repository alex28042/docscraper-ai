import * as fs from 'fs';
import { diffCrawls, importCrawlResult } from '../../generation/diff';

export async function executeDiff(args: string[]): Promise<void> {
  if (args.length < 2) {
    console.error('Error: diff requires two JSON file paths');
    console.error('Usage: docscraper-ai diff <previous.json> <current.json>');
    process.exit(1);
  }

  const previousPath = args[0];
  const currentPath = args[1];

  const previousJson = fs.readFileSync(previousPath, 'utf-8');
  const currentJson = fs.readFileSync(currentPath, 'utf-8');

  const previous = importCrawlResult(previousJson);
  const current = importCrawlResult(currentJson);

  const diff = diffCrawls(previous, current);

  process.stderr.write(`Diff summary:\n`);
  process.stderr.write(`  Added:     ${diff.summary.added}\n`);
  process.stderr.write(`  Removed:   ${diff.summary.removed}\n`);
  process.stderr.write(`  Modified:  ${diff.summary.modified}\n`);
  process.stderr.write(`  Unchanged: ${diff.summary.unchanged}\n`);

  console.log(JSON.stringify(diff, null, 2));
}
