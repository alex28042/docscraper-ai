import * as path from 'path';
import type { CrawlResult, TreeNode } from '../types';
import type { IContentWriter } from '../interfaces';
import { buildTree } from './tree-builder';
import { generateIndex, generatePageFile } from './content-generator';

export function generateSkillTree(
  result: CrawlResult,
  outputDir: string,
  writer: IContentWriter,
): { files: string[]; indexPath: string } {
  const urlObj = new URL(result.startUrl);
  const topicName =
    urlObj.hostname.replace('www.', '').split('.')[0] +
    (urlObj.pathname !== '/' ? ' ' + urlObj.pathname.replace(/\//g, ' ').trim() : '') +
    ' docs';
  const topicNameTitled = topicName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const roots = buildTree(result.pages, result.startUrl);

  const allNodes = new Map<string, TreeNode>();
  function collectNodes(nodes: TreeNode[]): void {
    for (const node of nodes) {
      allNodes.set(node.slug, node);
      collectNodes(node.children);
    }
  }
  collectNodes(roots);

  writer.ensureDirectory(outputDir);

  const files: string[] = [];

  const indexContent = generateIndex(roots, result, topicNameTitled);
  const indexPath = path.join(outputDir, '_index.md');
  writer.writeFile(indexPath, indexContent);
  files.push('_index.md');

  for (const [, node] of allNodes) {
    const content = generatePageFile(node, allNodes);
    const fileName = `${node.slug}.md`;
    writer.writeFile(path.join(outputDir, fileName), content);
    files.push(fileName);
  }

  return { files, indexPath };
}
