import * as cheerio from 'cheerio';
import type { ICodeExtractor, CodeSnippet } from '../interfaces/code-extractor';

type CheerioSelection = ReturnType<cheerio.CheerioAPI>;

const LANGUAGE_CLASS_PATTERNS = [
  /^language-(.+)$/,
  /^lang-(.+)$/,
  /^hljs-(.+)$/,
  /^highlight-(.+)$/,
];

function detectLanguage(classAttr: string | undefined): string {
  if (!classAttr) return '';

  const classes = classAttr.split(/\s+/);
  for (const cls of classes) {
    for (const pattern of LANGUAGE_CLASS_PATTERNS) {
      const match = cls.match(pattern);
      if (match) {
        return match[1];
      }
    }
  }
  return '';
}

function findContext($: cheerio.CheerioAPI, el: CheerioSelection): string {
  const headingSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  // Walk previous siblings and ancestors to find nearest heading
  let current = el;

  // Check preceding siblings first
  let prev = current.prev();
  while (prev.length > 0) {
    for (const selector of headingSelectors) {
      if (prev.is(selector)) {
        return prev.text().trim();
      }
    }
    // Check if the prev sibling contains a heading
    const headingInPrev = prev.find(headingSelectors.join(', ')).last();
    if (headingInPrev.length > 0) {
      return headingInPrev.text().trim();
    }
    prev = prev.prev();
  }

  // Walk up to parent and check its preceding siblings
  const parent = current.parent();
  if (parent.length > 0 && parent.prop('tagName')?.toLowerCase() !== 'html') {
    return findContext($, parent);
  }

  return '';
}

export class CheerioCodeExtractor implements ICodeExtractor {
  extract(html: string): CodeSnippet[] {
    const $ = cheerio.load(html, { xml: false } as cheerio.CheerioOptions);
    const snippets: CodeSnippet[] = [];
    const seen = new Set<string>();

    $('pre code').each((_, element) => {
      const codeEl = $(element);
      const code = codeEl.text().trim();

      if (!code) return;

      // Deduplicate identical code blocks
      if (seen.has(code)) return;
      seen.add(code);

      const codeClass = codeEl.attr('class');
      const preClass = codeEl.parent().attr('class');
      const language = detectLanguage(codeClass) || detectLanguage(preClass);

      const preEl = codeEl.closest('pre');
      const context = findContext($, preEl);

      snippets.push({ language, code, context });
    });

    return snippets;
  }
}
