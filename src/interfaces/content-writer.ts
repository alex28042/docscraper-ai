export interface IContentWriter {
  writeFile(filePath: string, content: string): void;
  ensureDirectory(dirPath: string): void;
}
