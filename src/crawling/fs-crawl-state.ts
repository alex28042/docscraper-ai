import * as fs from 'fs';
import * as path from 'path';
import type { ICrawlStateStore, CrawlState } from '../types';
import { CrawlStateError } from '../errors';

/** File-system based crawl state store with atomic writes */
export class FsCrawlStateStore implements ICrawlStateStore {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async load(): Promise<CrawlState | undefined> {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as CrawlState;
      // Restore Date objects
      parsed.startedAt = new Date(parsed.startedAt);
      for (const page of parsed.pages) {
        page.fetchedAt = new Date(page.fetchedAt);
      }
      return parsed;
    } catch {
      return undefined;
    }
  }

  async save(state: CrawlState): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      fs.mkdirSync(dir, { recursive: true });

      const tmpPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new CrawlStateError(
        'save',
        `Failed to save crawl state to ${this.filePath}: ${message}`,
      );
    }
  }

  async clear(): Promise<void> {
    try {
      fs.unlinkSync(this.filePath);
    } catch {
      // File may not exist, ignore
    }
  }
}
