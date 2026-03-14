import { describe, it, expect } from 'vitest';
import { TurndownConverter } from '../../../src/parsing/converter';

describe('TurndownConverter', () => {
  const converter = new TurndownConverter();

  it('should convert headings to ATX style', () => {
    const md = converter.convert('<h1>Hello</h1>');
    expect(md).toBe('# Hello');
  });

  it('should convert paragraphs', () => {
    const md = converter.convert('<p>Some text</p>');
    expect(md).toBe('Some text');
  });

  it('should convert code blocks to fenced style', () => {
    const md = converter.convert('<pre><code>const x = 1;</code></pre>');
    expect(md).toContain('```');
    expect(md).toContain('const x = 1;');
  });

  it('should remove images', () => {
    const md = converter.convert('<p>Text <img src="foo.png" alt="image"> more</p>');
    expect(md).not.toContain('foo.png');
    expect(md).toContain('Text');
    expect(md).toContain('more');
  });

  it('should use dash for bullet lists', () => {
    const md = converter.convert('<ul><li>A</li><li>B</li></ul>');
    expect(md).toContain('-   A');
    expect(md).toContain('-   B');
  });

  it('should collapse excessive blank lines', () => {
    const md = converter.convert('<p>A</p><p></p><p></p><p></p><p>B</p>');
    expect(md).not.toMatch(/\n{3,}/);
  });

  it('should handle empty input', () => {
    const md = converter.convert('');
    expect(md).toBe('');
  });

  it('should convert bold and italic', () => {
    const md = converter.convert('<p><strong>bold</strong> and <em>italic</em></p>');
    expect(md).toContain('**bold**');
    expect(md).toContain('*italic*');
  });
});
