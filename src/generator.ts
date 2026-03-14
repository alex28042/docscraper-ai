import * as fs from 'fs';
import * as path from 'path';
import { TreeNode, CrawlResult } from './types';
import { buildTree } from './tree-builder';

function fileNameForSlug(slug: string): string {
  return `${slug}.md`;
}

function generateIndex(
  roots: TreeNode[],
  result: CrawlResult,
  topicName: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# ${topicName}`,
    `> Source: ${result.startUrl} | ${result.stats.totalPages} pages | ${date}`,
    '',
    '## Topics',
    '',
  ];

  function renderTree(nodes: TreeNode[], indent: number): void {
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

function generatePageFile(node: TreeNode, allNodes: Map<string, TreeNode>): string {
  const lines: string[] = [
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
  const siblings: TreeNode[] = [];
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

export function generateSkillTree(
  result: CrawlResult,
  outputDir: string,
): { files: string[]; indexPath: string } {
  // Derive topic name from URL
  const urlObj = new URL(result.startUrl);
  const topicName =
    urlObj.hostname.replace('www.', '').split('.')[0] +
    (urlObj.pathname !== '/' ? ' ' + urlObj.pathname.replace(/\//g, ' ').trim() : '') +
    ' docs';
  const topicNameTitled = topicName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Build tree
  const roots = buildTree(result.pages, result.startUrl);

  // Collect all nodes into a map
  const allNodes = new Map<string, TreeNode>();
  function collectNodes(nodes: TreeNode[]): void {
    for (const node of nodes) {
      allNodes.set(node.slug, node);
      collectNodes(node.children);
    }
  }
  collectNodes(roots);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const files: string[] = [];

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
