"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetcher = void 0;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; WebScraperSDK/1.0; +https://github.com/web-scraper-sdk)';
class Fetcher {
    config;
    lastRequestTime = 0;
    constructor(config = {}) {
        this.config = {
            rateLimit: config.rateLimit ?? 5,
            timeoutMs: config.timeoutMs ?? 10_000,
            userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
            headers: config.headers ?? {},
            concurrency: config.concurrency ?? 3,
        };
    }
    async fetch(url, opts) {
        await this.rateLimit();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                keepalive: true,
                headers: {
                    'User-Agent': this.config.userAgent,
                    Accept: 'text/html,application/xhtml+xml',
                    ...this.config.headers,
                },
                redirect: 'follow',
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            if (!opts?.allowAnyContent) {
                const contentType = response.headers.get('content-type') ?? '';
                if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
                    throw new Error(`Unsupported content type: ${contentType}`);
                }
            }
            return await response.text();
        }
        finally {
            clearTimeout(timeout);
        }
    }
    /**
     * Fetch multiple URLs concurrently with a semaphore-based concurrency limit.
     * Returns results in the same order as the input URLs.
     */
    async fetchMultiple(urls, opts) {
        const concurrency = this.config.concurrency;
        const results = new Array(urls.length);
        // Semaphore: track number of in-flight requests
        let running = 0;
        let nextIndex = 0;
        const waiters = [];
        const acquire = () => {
            if (running < concurrency) {
                running++;
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                waiters.push(() => {
                    running++;
                    resolve();
                });
            });
        };
        const release = () => {
            running--;
            const next = waiters.shift();
            if (next)
                next();
        };
        const fetchOne = async (url, index) => {
            await acquire();
            try {
                const html = await this.fetch(url, opts);
                results[index] = { url, html };
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                results[index] = { url, error: message };
            }
            finally {
                release();
            }
        };
        await Promise.all(urls.map((url, i) => fetchOne(url, i)));
        return results;
    }
    async rateLimit() {
        if (this.config.rateLimit <= 0)
            return;
        const minInterval = 1000 / this.config.rateLimit;
        const elapsed = Date.now() - this.lastRequestTime;
        const waitTime = minInterval - elapsed;
        if (waitTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }
}
exports.Fetcher = Fetcher;
//# sourceMappingURL=fetcher.js.map