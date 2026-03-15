import type { PageMetadata } from '../types';

export interface IMetadataExtractor {
  extract(html: string, url: string): PageMetadata;
}
