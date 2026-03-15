import type { IHttpClient } from '../interfaces/http-client';
import { MissingDependencyError } from '../errors';

export interface PlaywrightOptions {
  waitForSelector?: string;
  waitForNetworkIdle?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
}

interface PlaywrightBrowser {
  newPage(): Promise<PlaywrightPage>;
  close(): Promise<void>;
}

interface PlaywrightPage {
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  goto(url: string, options?: Record<string, unknown>): Promise<void>;
  waitForSelector(selector: string, options?: { timeout: number }): Promise<void>;
  content(): Promise<string>;
  close(): Promise<void>;
}

export class PlaywrightHttpClient implements IHttpClient {
  private browser: PlaywrightBrowser | null = null;
  private readonly options: PlaywrightOptions;

  constructor(options: PlaywrightOptions = {}) {
    this.options = options;
  }

  async fetch(
    url: string,
    options?: { allowAnyContent?: boolean; timeoutMs?: number },
  ): Promise<string> {
    if (!this.browser) {
      await this.launchBrowser();
    }

    const page = await this.browser!.newPage();

    try {
      if (this.options.viewportWidth || this.options.viewportHeight) {
        await page.setViewportSize({
          width: this.options.viewportWidth ?? 1280,
          height: this.options.viewportHeight ?? 720,
        });
      }

      const navigationOptions: Record<string, unknown> = {};
      if (options?.timeoutMs) {
        navigationOptions.timeout = options.timeoutMs;
      }
      if (this.options.waitForNetworkIdle) {
        navigationOptions.waitUntil = 'networkidle';
      }

      await page.goto(url, navigationOptions);

      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector, {
          timeout: options?.timeoutMs ?? 30000,
        });
      }

      return await page.content();
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async launchBrowser(): Promise<void> {
    try {
      const moduleName = 'playwright';
      const pw = (await import(moduleName)) as {
        chromium: { launch(): Promise<PlaywrightBrowser> };
      };
      this.browser = await pw.chromium.launch();
    } catch {
      throw new MissingDependencyError(
        'playwright',
        'npm install playwright && npx playwright install chromium',
      );
    }
  }
}
