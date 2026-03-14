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
exports.generateSkillTree = generateSkillTree;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tree_builder_1 = require("./tree-builder");
function fileNameForSlug(slug) {
    return `${slug}.md`;
}
function generateIndex(roots, result, topicName) {
    const date = new Date().toISOString().slice(0, 10);
    const lines = [
        `# ${topicName}`,
        `> Source: ${result.startUrl} | ${result.stats.totalPages} pages | ${date}`,
        '',
        '## Topics',
        '',
    ];
    function renderTree(nodes, indent) {
        for (const node of nodes) {
            const prefix = '  '.repeat(indent) + '-';
            const desc = node.markdown.slice(0, 120).replace(/\n/g, ' ').trim();
            const summary = desc ? ` — ${desc.slice(0, 80)}${desc.length > 80 ? '...' : ''}` : '';
            lines.push(`${prefix} [${node.title}](./${fileNameForSlug(node.slug)})${summary}`);
            if (node.children.length > 0) {
                renderTree(node.children, indent + 1);
            }
        }
    }
    renderTree(roots, 0);
    return lines.join('\n') + '\n';
}
function generatePageFile(node, allNodes) {
    const lines = [
        `# ${node.title}`,
        `> Source: ${node.url}`,
        '',
    ];
    // Navigation
    const navParts = ['[← Index](./_index.md)'];
    if (node.parentSlug) {
        const parent = allNodes.get(node.parentSlug);
        if (parent) {
            navParts.push(`[↑ ${parent.title}](./${fileNameForSlug(parent.slug)})`);
        }
    }
    lines.push(`**Nav:** ${navParts.join(' | ')}`);
    lines.push('', '---', '');
    // Content
    lines.push(node.markdown);
    // Related links (siblings)
    const siblings = [];
    if (node.parentSlug) {
        const parent = allNodes.get(node.parentSlug);
        if (parent) {
            siblings.push(...parent.children.filter((c) => c.slug !== node.slug));
        }
    }
    // Also include children as related
    const related = [...node.children, ...siblings].slice(0, 5);
    if (related.length > 0) {
        lines.push('', '---');
        const relatedLinks = related
            .map((r) => `[${r.title}](./${fileNameForSlug(r.slug)})`)
            .join(', ');
        lines.push(`**Related:** ${relatedLinks}`);
    }
    return lines.join('\n') + '\n';
}
function generateSkillTree(result, outputDir) {
    // Derive topic name from URL
    const urlObj = new URL(result.startUrl);
    const topicName = urlObj.hostname.replace('www.', '').split('.')[0] +
        (urlObj.pathname !== '/' ? ' ' + urlObj.pathname.replace(/\//g, ' ').trim() : '') +
        ' docs';
    const topicNameTitled = topicName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    // Build tree
    const roots = (0, tree_builder_1.buildTree)(result.pages, result.startUrl);
    // Collect all nodes into a map
    const allNodes = new Map();
    function collectNodes(nodes) {
        for (const node of nodes) {
            allNodes.set(node.slug, node);
            collectNodes(node.children);
        }
    }
    collectNodes(roots);
    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });
    const files = [];
    // Write index
    const indexContent = generateIndex(roots, result, topicNameTitled);
    const indexPath = path.join(outputDir, '_index.md');
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    files.push('_index.md');
    // Write individual pages
    for (const [, node] of allNodes) {
        const content = generatePageFile(node, allNodes);
        const fileName = fileNameForSlug(node.slug);
        fs.writeFileSync(path.join(outputDir, fileName), content, 'utf-8');
        files.push(fileName);
    }
    return { files, indexPath };
}
//# sourceMappingURL=generator.js.map