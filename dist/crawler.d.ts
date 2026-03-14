import { ScraperConfig, CrawlOptions, PageContent, CrawlResult } from './types';
export declare class Crawler {
    private readonly fetcher;
    private readonly concurrency;
    constructor(config?: ScraperConfig);
    scrapePage(url: string): Promise<PageContent>;
    private processHtml;
    crawl(startUrl: string, options?: CrawlOptions): Promise<CrawlResult>;
}
//# sourceMappingURL=crawler.d.ts.map