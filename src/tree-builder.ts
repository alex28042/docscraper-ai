import { PageContent, TreeNode } from './types';

/**
 * Converts a URL path into a filename-safe slug.
 * e.g. "/docs/api/charges" → "api--charges" (relative to start path)
 */
function pathToSlug(url: string, basePath: string): string {
  const parsed = new URL(url);
  let path = parsed.pathname;

  // Remove base path prefix
  if (path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }

  // Clean up
  path = path.replace(/^\/+|\/+$/g, '');

  if (!path) return 'index';

  return path
    .split('/')
    .map((seg) =>
      seg
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .join('--');
}

/**
 * Organizes flat page list into a tree hierarchy based on URL paths.
 */
export function buildTree(pages: PageContent[], startUrl: string): TreeNode[] {
  const basePath = new URL(startUrl).pathname.replace(/\/+$/, '');

  // Create nodes for all pages
  const nodeMap = new Map<string, TreeNode>();
  const nodes: TreeNode[] = [];

  for (const page of pages) {
    const slug = pathToSlug(page.url, basePath);
    const node: TreeNode = {
      slug,
      title: page.title,
      url: page.url,
      markdown: page.markdown,
      children: [],
      parentSlug: '',
    };
    nodeMap.set(slug, node);
    nodes.push(node);
  }

  // Build parent-child relationships based on slug nesting
  const roots: TreeNode[] = [];

  for (const node of nodes) {
    const parts = node.slug.split('--');
    let parentFound = false;

    // Walk up the slug segments to find a parent
    for (let i = parts.length - 1; i > 0; i--) {
      const parentSlug = parts.slice(0, i).join('--');
      const parent = nodeMap.get(parentSlug);
      if (parent) {
        node.parentSlug = parentSlug;
        parent.children.push(node);
        parentFound = true;
        break;
      }
    }

    if (!parentFound) {
      roots.push(node);
    }
  }

  // Sort children alphabetically by title
  function sortChildren(node: TreeNode): void {
    node.children.sort((a, b) => a.title.localeCompare(b.title));
    node.children.forEach(sortChildren);
  }
  roots.sort((a, b) => a.title.localeCompare(b.title));
  roots.forEach(sortChildren);

  return roots;
}
