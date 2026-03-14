export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

export interface ISearchEngine {
  search(query: string): Promise<SearchResult[]>;
}
