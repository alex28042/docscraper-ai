import { describe, it, expect } from 'vitest';
import { CheerioCodeExtractor } from '../../../src/parsing/code-extractor';

describe('CheerioCodeExtractor', () => {
  const extractor = new CheerioCodeExtractor();

  it('should extract code from <pre><code> blocks', () => {
    const html = '<html><body><pre><code>const x = 1;</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].code).toBe('const x = 1;');
  });

  it('should detect language from language-* class on <code>', () => {
    const html =
      '<html><body><pre><code class="language-typescript">const x: number = 1;</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('typescript');
  });

  it('should detect language from lang-* class', () => {
    const html =
      '<html><body><pre><code class="lang-js">console.log("hi")</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets[0].language).toBe('js');
  });

  it('should detect language from hljs-* class', () => {
    const html =
      '<html><body><pre><code class="hljs-python">print("hello")</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets[0].language).toBe('python');
  });

  it('should detect language from <pre> class when <code> has no language class', () => {
    const html =
      '<html><body><pre class="language-go"><code>fmt.Println("hello")</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets[0].language).toBe('go');
  });

  it('should return empty language when no language class is found', () => {
    const html = '<html><body><pre><code>some code</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets[0].language).toBe('');
  });

  it('should extract context from nearest preceding heading', () => {
    const html = `
      <html><body>
        <h2>Installation</h2>
        <p>Run the following command:</p>
        <pre><code class="language-bash">npm install foo</code></pre>
      </body></html>
    `;
    const snippets = extractor.extract(html);

    expect(snippets[0].context).toBe('Installation');
  });

  it('should extract context from h3 heading', () => {
    const html = `
      <html><body>
        <h3>Configuration</h3>
        <pre><code>config = {}</code></pre>
      </body></html>
    `;
    const snippets = extractor.extract(html);

    expect(snippets[0].context).toBe('Configuration');
  });

  it('should return empty context when no heading is found', () => {
    const html = '<html><body><pre><code>orphan code</code></pre></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets[0].context).toBe('');
  });

  it('should deduplicate identical code blocks', () => {
    const html = `
      <html><body>
        <pre><code>const x = 1;</code></pre>
        <pre><code>const x = 1;</code></pre>
      </body></html>
    `;
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(1);
  });

  it('should keep different code blocks', () => {
    const html = `
      <html><body>
        <pre><code>const x = 1;</code></pre>
        <pre><code>const y = 2;</code></pre>
      </body></html>
    `;
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(2);
  });

  it('should skip empty code blocks', () => {
    const html = `
      <html><body>
        <pre><code>   </code></pre>
        <pre><code>real code</code></pre>
      </body></html>
    `;
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].code).toBe('real code');
  });

  it('should extract multiple code blocks with different languages', () => {
    const html = `
      <html><body>
        <h2>Examples</h2>
        <pre><code class="language-javascript">console.log("js")</code></pre>
        <pre><code class="language-python">print("py")</code></pre>
      </body></html>
    `;
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(2);
    expect(snippets[0].language).toBe('javascript');
    expect(snippets[1].language).toBe('python');
  });

  it('should ignore standalone <code> not inside <pre>', () => {
    const html = '<html><body><p>Use <code>npm install</code> to install.</p></body></html>';
    const snippets = extractor.extract(html);

    expect(snippets).toHaveLength(0);
  });
});
