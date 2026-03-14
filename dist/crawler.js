"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crawler = void 0;
const fetcher_1 = require("./fetcher");
const parser_1 = require("./parser");
const converter_1 = require("./converter");
const link_extractor_1 = require("./link-extractor");
class Crawler {
    fetcher;
    concurrency;
    constructor(config = {}) {
        this.fetcher = new fetcher_1.Fetcher(config);
        this.concurrency = config.concurrency ?? 3;
    }
    async scrapePage(url) {
        const html = await this.fetcher.fetch(url);
        const parsed = (0, parser_1.parsePage)(html, url);
        const markdown = (0, converter_1.htmlToMarkdown)(parsed.mainHtml);
        const links = (0, link_extractor_1.extractLinks)(html, url);
        return {
            url,
            title: parsed.title,
            description: parsed.description,
            markdown,
            links,
            fetchedAt: new Date(),
        };
    }
    processHtml(url, html) {
        const parsed = (0, parser_1.parsePage)(html, url);
        const markdown = (0, converter_1.htmlToMarkdown)(parsed.mainHtml);
        const links = (0, link_extractor_1.extractLinks)(html, url);
        return {
            url,
            title: parsed.title,
            description: parsed.description,
            markdown,
            links,
            fetchedAt: new Date(),
        };
    }
    async crawl(startUrl, options = {}) {
        const maxDepth = options.maxDepth ?? 2;
        const maxPages = options.maxPages ?? 50;
        const includePatterns = options.includePatterns ?? [];
        const excludePatterns = options.excludePatterns ?? [];
        const visited = new Set();
        const pages = [];
        const errors = [];
        const startedAt = new Date();
        // BFS queue: [url, depth]
        const queue = [[startUrl, 0]];
        visited.add(startUrl);
        while (queue.length > 0 && pages.length < maxPages) {
            // Pull a batch of up to `concurrency` items from the queue
            const batchSize = Math.min(this.concurrency, queue.length, maxPages - pages.length);
            const batch = queue.splice(0, batchSize);
            const batchUrls = batch.map(([url]) => url);
            process.stderr.write(`[${pages.length + 1}-${pages.length + batchSize}/${maxPages}] Crawling ${batchSize} pages concurrently\n`);
            const results = await this.fetcher.fetchMultiple(batchUrls);
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const [url, depth] = batch[i];
                if (result.error) {
                    errors.push({ url, error: result.error });
                    process.stderr.write(`[error] ${url}: ${result.error}\n`);
                    continue;
                }
                try {
                    const page = this.processHtml(url, result.html);
                    pages.push(page);
                    // Enqueue child links if we haven't hit max depth
                    if (depth < maxDepth) {
                        const childLinks = (0, link_extractor_1.filterLinks)(page.links, includePatterns, excludePatterns);
                        for (const link of childLinks) {
                            if (!visited.has(link) && pages.length + queue.length < maxPages) {
                                visited.add(link);
                                queue.push([link, depth + 1]);
                            }
                        }
                    }
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    errors.push({ url, error: message });
                    process.stderr.write(`[error] ${url}: ${message}\n`);
                }
            }
        }
        const completedAt = new Date();
        const stats = {
            totalPages: pages.length,
            totalErrors: errors.length,
            durationMs: completedAt.getTime() - startedAt.getTime(),
            startedAt,
            completedAt,
        };
        return { startUrl, pages, errors, stats };
    }
}
exports.Crawler = Crawler;
//# sourceMappingURL=crawler.js.map