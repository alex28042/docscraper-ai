"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Discoverer = void 0;
const fetcher_1 = require("./fetcher");
const cheerio = __importStar(require("cheerio"));
/** Domains to skip — community/aggregator sites */
const SKIP_DOMAINS = [
    'medium.com',
    'dev.to',
    'stackoverflow.com',
    'stackexchange.com',
    'reddit.com',
    'quora.com',
    'w3schools.com',
    'geeksforgeeks.org',
    'tutorialspoint.com',
    'youtube.com',
    'twitter.com',
    'x.com',
];
/** Boost score for domains likely to be official docs */
const OFFICIAL_SIGNALS = [
    { pattern: /docs?\./i, boost: 3 },
    { pattern: /developer\./i, boost: 3 },
    { pattern: /api\./i, boost: 2 },
    { pattern: /\/docs\//i, boost: 2 },
    { pattern: /\/api\//i, boost: 2 },
    { pattern: /\/reference\//i, boost: 2 },
    { pattern: /\/guide/i, boost: 1 },
    { pattern: /github\.com\/[^/]+\/[^/]+$/i, boost: 2 },
    { pattern: /github\.com\/[^/]+\/[^/]+\/(blob|tree)\/.*readme/i, boost: 1 },
];
class Discoverer {
    fetcher;
    constructor() {
        this.fetcher = new fetcher_1.Fetcher({
            rateLimit: 2,
            timeoutMs: 15_000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
    }
    async discover(topic, maxResults = 4) {
        const query = `${topic} official documentation API reference`;
        const results = await this.searchDuckDuckGo(query);
        // Filter out community/aggregator sites
        const filtered = results.filter((r) => !SKIP_DOMAINS.some((d) => new URL(r.url).hostname.includes(d)));
        // Score and rank
        const scored = filtered.map((r) => {
            let score = 0;
            for (const signal of OFFICIAL_SIGNALS) {
                if (signal.pattern.test(r.url)) {
                    score += signal.boost;
                }
            }
            return { ...r, score };
        });
        scored.sort((a, b) => b.score - a.score);
        // Deduplicate by domain
        const seen = new Set();
        const deduped = [];
        for (const r of scored) {
            const domain = new URL(r.url).hostname;
            if (!seen.has(domain)) {
                seen.add(domain);
                deduped.push({ url: r.url, title: r.title, snippet: r.snippet });
            }
            if (deduped.length >= maxResults)
                break;
        }
        return deduped;
    }
    async searchDuckDuckGo(query) {
        const encoded = encodeURIComponent(query);
        const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
        const html = await this.fetcher.fetch(url, { allowAnyContent: true });
        const $ = cheerio.load(html);
        const results = [];
        $('.result').each((_, el) => {
            const linkEl = $(el).find('.result__a').first();
            const snippetEl = $(el).find('.result__snippet').first();
            let href = linkEl.attr('href') ?? '';
            const title = linkEl.text().trim();
            const snippet = snippetEl.text().trim();
            if (!href || !title)
                return;
            // DuckDuckGo wraps URLs in a redirect — extract the actual URL
            try {
                if (href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) {
                        href = decodeURIComponent(match[1]);
                    }
                }
                // Validate it's a proper URL
                new URL(href);
                results.push({ url: href, title, snippet });
            }
            catch {
                // Skip malformed URLs
            }
        });
        return results;
    }
}
exports.Discoverer = Discoverer;
//# sourceMappingURL=discoverer.js.map