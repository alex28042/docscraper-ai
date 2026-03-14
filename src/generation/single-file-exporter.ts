import type { CrawlResult } from '../types';
import type { IContentWriter } from '../interfaces';

export interface SingleFileExportOptions {
  includeMetadata?: boolean;
  separator?: string;
}

export function exportToSingleFile(result: CrawlResult, options?: SingleFileExportOptions): string {
  const includeMetadata = options?.includeMetadata ?? true;
  const separator = options?.separator ?? '\n\n---\n\n';

  const sections: string[] = [];

  if (includeMetadata) {
    const date = result.stats.completedAt.toISOString().slice(0, 10);
    const durationSeconds = (result.stats.durationMs / 1000).toFixed(1);
    const header = [
      `# Crawl Export`,
      '',
      `- **Start URL:** ${result.startUrl}`,
      `- **Total pages:** ${result.stats.totalPages}`,
      `- **Duration:** ${durationSeconds}s`,
      `- **Date:** ${date}`,
    ].join('\n');
    sections.push(header);
  }

  for (const page of result.pages) {
    const pageSection = [`## ${page.title}`, '', `> Source: ${page.url}`, '', page.markdown].join(
      '\n',
    );
    sections.push(pageSection);
  }

  return sections.join(separator) + '\n';
}

export function exportToSingleFileAndWrite(
  result: CrawlResult,
  outputPath: string,
  writer: IContentWriter,
  options?: SingleFileExportOptions,
): void {
  const content = exportToSingleFile(result, options);
  writer.writeFile(outputPath, content);
}
