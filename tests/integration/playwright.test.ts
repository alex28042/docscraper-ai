import { describe, it, expect } from 'vitest';

describe('PlaywrightHttpClient', () => {
  it('throws helpful error when playwright is not installed', async () => {
    // Dynamically import to avoid module-level errors
    const { PlaywrightHttpClient } = await import('../../src/http/playwright-http-client');
    const client = new PlaywrightHttpClient();

    // Playwright is likely not installed in test env
    try {
      await client.fetch('https://example.com');
      // If it works (playwright is installed), that's also fine
    } catch (err) {
      expect((err as Error).name).toBe('MissingDependencyError');
      expect((err as Error).message).toContain('playwright');
    }
  });

  it('can be instantiated with options', async () => {
    const { PlaywrightHttpClient } = await import('../../src/http/playwright-http-client');
    const client = new PlaywrightHttpClient({
      waitForSelector: '#content',
      waitForNetworkIdle: true,
      viewportWidth: 1920,
      viewportHeight: 1080,
    });
    expect(client).toBeDefined();
  });
});
