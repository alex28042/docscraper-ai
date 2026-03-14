export interface CodeSnippet {
  language: string;
  code: string;
  context: string;
}

export interface ICodeExtractor {
  extract(html: string): CodeSnippet[];
}
