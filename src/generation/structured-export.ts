import type {
  HeadingNode,
  StructuredPage,
  StructuredExport,
  PageContent,
  CrawlResult,
} from '../types';

/** Extract headings from markdown into a nested tree */
export function extractHeadings(markdown: string): HeadingNode[] {
  const lines = markdown.split('\n');
  const root: HeadingNode[] = [];
  const stack: { level: number; node: HeadingNode }[] = [];

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const node: HeadingNode = { level, text, children: [] };

    // Pop stack until we find a parent with lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ level, node });
  }

  return root;
}

/** Extract code blocks from markdown */
function extractCodeBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const regex = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

/** Convert a PageContent to a StructuredPage */
export function toStructuredPage(page: PageContent, codeBlocks?: string[]): StructuredPage {
  return {
    url: page.url,
    title: page.title,
    description: page.description,
    headings: extractHeadings(page.markdown),
    codeBlocks: codeBlocks ?? extractCodeBlocks(page.markdown),
    metadata: page.metadata,
    markdown: page.markdown,
  };
}

/** Export a full CrawlResult to structured JSON */
export function exportToStructuredJson(result: CrawlResult): StructuredExport {
  return {
    startUrl: result.startUrl,
    pages: result.pages.map((page) => toStructuredPage(page)),
    stats: result.stats,
    exportedAt: new Date(),
  };
}
