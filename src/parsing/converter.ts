import TurndownService from 'turndown';
import type { IHtmlConverter } from '../interfaces';

export class TurndownConverter implements IHtmlConverter {
  private readonly service: TurndownService;

  constructor() {
    this.service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
    });

    this.service.addRule('removeImages', {
      filter: 'img',
      replacement: () => '',
    });

    this.service.addRule('cleanBreaks', {
      filter: 'br',
      replacement: () => '\n',
    });
  }

  convert(html: string): string {
    const md = this.service.turndown(html);
    return md.replace(/\n{3,}/g, '\n\n').trim();
  }
}
