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
exports.parsePage = parsePage;
const cheerio = __importStar(require("cheerio"));
/** Selectors for elements to remove before extracting content */
const REMOVE_SELECTORS = [
    'script',
    'style',
    'nav',
    'footer',
    'header',
    'iframe',
    'noscript',
    '.sidebar',
    '.navigation',
    '.nav',
    '.footer',
    '.header',
    '.cookie-banner',
    '.ad',
    '.ads',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
];
/** Selectors to try for main content, in priority order */
const CONTENT_SELECTORS = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.main-content',
    '.post-content',
    '.article-content',
    '.documentation',
    '.docs-content',
    '#content',
    '#main',
];
function parsePage(html, url) {
    const $ = cheerio.load(html, { xml: false });
    // Extract metadata
    const title = $('title').first().text().trim() ||
        $('h1').first().text().trim() ||
        new URL(url).pathname;
    const description = $('meta[name="description"]').attr('content')?.trim() ??
        $('meta[property="og:description"]').attr('content')?.trim() ??
        '';
    // Remove noise elements
    $(REMOVE_SELECTORS.join(', ')).remove();
    // Find main content area
    let mainHtml = '';
    for (const selector of CONTENT_SELECTORS) {
        const el = $(selector).first();
        if (el.length > 0) {
            mainHtml = el.html() ?? '';
            break;
        }
    }
    // Fallback to body
    if (!mainHtml) {
        mainHtml = $('body').html() ?? '';
    }
    return { title, description, mainHtml };
}
//# sourceMappingURL=parser.js.map