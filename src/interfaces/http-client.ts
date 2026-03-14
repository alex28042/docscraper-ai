export interface IHttpClient {
  fetch(url: string, options?: { allowAnyContent?: boolean; timeoutMs?: number }): Promise<string>;
}
