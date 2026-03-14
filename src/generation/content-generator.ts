import type { TreeNode, CrawlResult } from '../types';

function fileNameForSlug(slug: string): string {
  return `${slug}.md`;
}

export function generateIndex(roots: TreeNode[], result: CrawlResult, topicName: string): string {
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

export function generatePageFile(node: TreeNode, allNodes: Map<string, TreeNode>): string {
  const lines: string[] = [`# ${node.title}`, `> Source: ${node.url}`, ''];

  const navParts = ['[← Index](./_index.md)'];
  if (node.parentSlug) {
    const parent = allNodes.get(node.parentSlug);
    if (parent) {
      navParts.push(`[↑ ${parent.title}](./${fileNameForSlug(parent.slug)})`);
    }
  }
  lines.push(`**Nav:** ${navParts.join(' | ')}`);
  lines.push('', '---', '');

  lines.push(node.markdown);

  const siblings: TreeNode[] = [];
  if (node.parentSlug) {
    const parent = allNodes.get(node.parentSlug);
    if (parent) {
      siblings.push(...parent.children.filter((c) => c.slug !== node.slug));
    }
  }
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
