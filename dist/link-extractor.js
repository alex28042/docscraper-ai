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
exports.extractLinks = extractLinks;
exports.filterLinks = filterLinks;
const cheerio = __importStar(require("cheerio"));
function extractLinks(html, baseUrl) {
    const $ = cheerio.load(html);
    const links = new Set();
    const base = new URL(baseUrl);
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href)
            return;
        try {
            const resolved = new URL(href, baseUrl);
            // Only keep same-origin HTTP(S) links
            if (resolved.origin !== base.origin)
                return;
            if (!resolved.protocol.startsWith('http'))
                return;
            // Strip hash and trailing slash for deduplication
            resolved.hash = '';
            let normalized = resolved.toString();
            if (normalized.endsWith('/') && normalized !== resolved.origin + '/') {
                normalized = normalized.slice(0, -1);
            }
            links.add(normalized);
        }
        catch {
            // Skip malformed URLs
        }
    });
    return Array.from(links);
}
function filterLinks(links, includePatterns, excludePatterns) {
    let filtered = links;
    if (includePatterns.length > 0) {
        const includeRegexes = includePatterns.map((p) => new RegExp(p));
        filtered = filtered.filter((url) => includeRegexes.some((re) => re.test(url)));
    }
    if (excludePatterns.length > 0) {
        const excludeRegexes = excludePatterns.map((p) => new RegExp(p));
        filtered = filtered.filter((url) => !excludeRegexes.some((re) => re.test(url)));
    }
    return filtered;
}
//# sourceMappingURL=link-extractor.js.map