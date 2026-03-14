#!/usr/bin/env node
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crawler_1 = require("./crawler");
const discoverer_1 = require("./discoverer");
function printUsage() {
    console.log(`
Usage:
  skill-tree discover <topic> [--max-results N]
  skill-tree scrape <url> [<url>...] [options]

Commands:
  discover    Search for official documentation URLs for a topic
  scrape      Scrape URLs and output markdown content

Discover options:
  --max-results <n>   Max URLs to return (default: 4)

Scrape options:
  --output <dir>      Output directory for .md files (default: stdout as JSON)
  --max-chars <n>     Skip pages over N characters (default: 80000)
  --concurrency <n>   Max concurrent requests (default: 3)

Examples:
  skill-tree discover "supabase auth"
  skill-tree scrape https://docs.stripe.com/api --output /tmp/raw
  skill-tree scrape https://hono.dev/docs https://hono.dev/api --output ./raw
`);
}
async function cmdDiscover(args) {
    if (args.length === 0) {
        console.error('Error: missing topic for discover');
        process.exit(1);
    }
    const topic = args[0];
    let maxResults = 4;
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--max-results') {
            maxResults = parseInt(args[++i], 10);
        }
    }
    process.stderr.write(`Discovering sources for: ${topic}\n`);
    const discoverer = new discoverer_1.Discoverer();
    const results = await discoverer.discover(topic, maxResults);
    if (results.length === 0) {
        console.error('No official sources found.');
        process.exit(1);
    }
    // Output as JSON for easy parsing by the skill
    console.log(JSON.stringify(results, null, 2));
}
async function cmdScrape(args) {
    const urls = [];
    let output = '';
    let maxChars = 80_000;
    let concurrency = 3;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--output') {
            output = args[++i];
        }
        else if (args[i] === '--max-chars') {
            maxChars = parseInt(args[++i], 10);
        }
        else if (args[i] === '--concurrency') {
            concurrency = parseInt(args[++i], 10);
        }
        else if (args[i].startsWith('http')) {
            urls.push(args[i]);
        }
    }
    if (urls.length === 0) {
        console.error('Error: no URLs provided for scrape');
        process.exit(1);
    }
    const crawler = new crawler_1.Crawler({ rateLimit: 3, timeoutMs: 15_000, concurrency });
    const pages = [];
    for (const url of urls) {
        process.stderr.write(`[${pages.length + 1}/${urls.length}] Scraping: ${url}\n`);
        try {
            const page = await crawler.scrapePage(url);
            if (page.markdown.length > maxChars) {
                process.stderr.write(`  Skipped (${page.markdown.length} chars > ${maxChars} limit)\n`);
                pages.push({
                    url,
                    title: page.title,
                    description: page.description,
                    markdown: '',
                    charCount: page.markdown.length,
                    skipped: true,
                });
                continue;
            }
            pages.push({
                url,
                title: page.title,
                description: page.description,
                markdown: page.markdown,
                charCount: page.markdown.length,
                skipped: false,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            process.stderr.write(`  Error: ${message}\n`);
            pages.push({
                url,
                title: '',
                description: '',
                markdown: '',
                charCount: 0,
                skipped: true,
                error: message,
            });
        }
    }
    if (output) {
        // Write individual .md files to output directory
        fs.mkdirSync(output, { recursive: true });
        for (const page of pages) {
            if (page.skipped)
                continue;
            const slug = new URL(page.url).pathname
                .replace(/^\/+|\/+$/g, '')
                .replace(/\//g, '--')
                .replace(/[^a-z0-9-]/gi, '-')
                .replace(/-+/g, '-')
                || 'index';
            const filePath = path.join(output, `${slug}.md`);
            const content = [
                `# ${page.title}`,
                `> Source: ${page.url}`,
                `> ${page.charCount} characters`,
                '',
                page.markdown,
            ].join('\n');
            fs.writeFileSync(filePath, content, 'utf-8');
            process.stderr.write(`  Wrote: ${filePath}\n`);
        }
        // Write manifest
        const manifest = pages.map((p) => ({
            url: p.url,
            title: p.title,
            chars: p.charCount,
            skipped: p.skipped,
            error: p.error,
        }));
        fs.writeFileSync(path.join(output, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
        process.stderr.write(`\nDone! ${pages.filter((p) => !p.skipped).length}/${urls.length} pages scraped to ${output}\n`);
    }
    else {
        // Output as JSON to stdout
        console.log(JSON.stringify(pages, null, 2));
    }
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printUsage();
        process.exit(0);
    }
    const command = args[0];
    switch (command) {
        case 'discover':
            await cmdDiscover(args.slice(1));
            break;
        case 'scrape':
            await cmdScrape(args.slice(1));
            break;
        default:
            // Legacy mode: treat first arg as URL if it starts with http
            if (command.startsWith('http')) {
                await cmdScrape(args);
            }
            else {
                console.error(`Unknown command: ${command}`);
                printUsage();
                process.exit(1);
            }
    }
}
main().catch((err) => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map