import * as fs from 'fs';
import type { IContentWriter } from '../interfaces';

export class FsContentWriter implements IContentWriter {
  writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  ensureDirectory(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
