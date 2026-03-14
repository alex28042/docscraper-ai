import type { CrawlStats } from '../types';

export interface CrawlProgressEvent {
  currentPage: number;
  totalPages: number;
  url: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ICrawlProgress {
  onPageComplete(event: CrawlProgressEvent): void;
  onCrawlComplete(stats: CrawlStats): void;
}

export class NullProgress implements ICrawlProgress {
  onPageComplete(): void {}
  onCrawlComplete(): void {}
}
