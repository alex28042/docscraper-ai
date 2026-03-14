import { ScraperConfig } from './types';
export declare class Fetcher {
    private readonly config;
    private lastRequestTime;
    constructor(config?: ScraperConfig);
    fetch(url: string, opts?: {
        allowAnyContent?: boolean;
    }): Promise<string>;
    /**
     * Fetch multiple URLs concurrently with a semaphore-based concurrency limit.
     * Returns results in the same order as the input URLs.
     */
    fetchMultiple(urls: string[], opts?: {
        allowAnyContent?: boolean;
    }): Promise<{
        url: string;
        html?: string;
        error?: string;
    }[]>;
    private rateLimit;
}
//# sourceMappingURL=fetcher.d.ts.map