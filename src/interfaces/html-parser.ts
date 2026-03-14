export interface ParsedPage {
  title: string;
  description: string;
  mainHtml: string;
}

export interface IHtmlParser {
  parse(html: string, url: string): ParsedPage;
}
