import TurndownService from 'turndown';

let service: TurndownService | null = null;

function getService(): TurndownService {
  if (!service) {
    service = new TurndownService({
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

export function htmlToMarkdown(html: string): string {
  const md = getService().turndown(html);

  // Collapse 3+ consecutive blank lines into 2
  return md.replace(/\n{3,}/g, '\n\n').trim();
}
