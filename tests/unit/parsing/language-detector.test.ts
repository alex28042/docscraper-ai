import { describe, it, expect } from 'vitest';
import { detectLanguageFromHtml } from '../../../src/parsing/language-detector';

describe('detectLanguageFromHtml', () => {
  it('detects language from html lang attribute', () => {
    const html = `<html lang="en"><head></head><body>Hello</body></html>`;
    expect(detectLanguageFromHtml(html)).toBe('en');
  });

  it('normalizes to lowercase', () => {
    const html = `<html lang="EN-US"><head></head><body>Hello</body></html>`;
    expect(detectLanguageFromHtml(html)).toBe('en-us');
  });

  it('detects from http-equiv content-language', () => {
    const html = `
      <html>
        <head><meta http-equiv="content-language" content="fr"></head>
        <body>Bonjour</body>
      </html>
    `;
    expect(detectLanguageFromHtml(html)).toBe('fr');
  });

  it('detects from meta name="language"', () => {
    const html = `
      <html>
        <head><meta name="language" content="de"></head>
        <body>Hallo</body>
      </html>
    `;
    expect(detectLanguageFromHtml(html)).toBe('de');
  });

  it('prefers html lang over meta tags', () => {
    const html = `
      <html lang="en">
        <head><meta name="language" content="fr"></head>
        <body>Hello</body>
      </html>
    `;
    expect(detectLanguageFromHtml(html)).toBe('en');
  });

  it('returns null when no language info found', () => {
    const html = `<html><head></head><body>Hello</body></html>`;
    expect(detectLanguageFromHtml(html)).toBeNull();
  });
});
