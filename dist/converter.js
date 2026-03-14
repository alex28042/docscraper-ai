"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlToMarkdown = htmlToMarkdown;
const turndown_1 = __importDefault(require("turndown"));
let service = null;
function getService() {
    if (!service) {
        service = new turndown_1.default({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
            emDelimiter: '*',
        });
        // Remove images to keep output text-focused
        service.addRule('removeImages', {
            filter: 'img',
            replacement: () => '',
        });
        // Clean up excessive whitespace
        service.addRule('cleanBreaks', {
            filter: 'br',
            replacement: () => '\n',
        });
    }
    return service;
}
function htmlToMarkdown(html) {
    const md = getService().turndown(html);
    // Collapse 3+ consecutive blank lines into 2
    return md.replace(/\n{3,}/g, '\n\n').trim();
}
//# sourceMappingURL=converter.js.map