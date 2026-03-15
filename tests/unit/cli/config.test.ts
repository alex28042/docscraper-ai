import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { findConfigFile, loadConfig, mergeConfig } from '../../../src/cli/config';

describe('findConfigFile', () => {
  it('returns null when no config file exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docscraper-test-'));
    try {
      expect(findConfigFile(tmpDir)).toBeNull();
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('finds config file in current directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docscraper-test-'));
    const configPath = path.join(tmpDir, '.docscraperrc.json');
    try {
      fs.writeFileSync(configPath, '{}', 'utf-8');
      expect(findConfigFile(tmpDir)).toBe(configPath);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('finds config file in parent directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docscraper-test-'));
    const childDir = path.join(tmpDir, 'child');
    const configPath = path.join(tmpDir, '.docscraperrc.json');
    try {
      fs.mkdirSync(childDir);
      fs.writeFileSync(configPath, '{}', 'utf-8');
      expect(findConfigFile(childDir)).toBe(configPath);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

describe('loadConfig', () => {
  it('returns empty object when no config exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docscraper-test-'));
    try {
      const config = loadConfig(tmpDir);
      expect(config).toEqual({});
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('loads and validates config', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docscraper-test-'));
    try {
      fs.writeFileSync(
        path.join(tmpDir, '.docscraperrc.json'),
        JSON.stringify({ concurrency: 5, rateLimit: 10 }),
        'utf-8',
      );
      const config = loadConfig(tmpDir);
      expect(config.concurrency).toBe(5);
      expect(config.rateLimit).toBe(10);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

describe('mergeConfig', () => {
  it('CLI flags override file config', () => {
    const fileConfig = { concurrency: 3, rateLimit: 5, output: '/tmp/docs' };
    const cliFlags = { concurrency: 10 };
    const merged = mergeConfig(fileConfig, cliFlags);
    expect(merged.concurrency).toBe(10);
    expect(merged.rateLimit).toBe(5);
    expect(merged.output).toBe('/tmp/docs');
  });

  it('ignores undefined CLI flags', () => {
    const fileConfig = { concurrency: 3 };
    const cliFlags = { concurrency: undefined };
    const merged = mergeConfig(fileConfig, cliFlags);
    expect(merged.concurrency).toBe(3);
  });

  it('returns file config when no CLI flags', () => {
    const fileConfig = { concurrency: 3, rateLimit: 5 };
    const merged = mergeConfig(fileConfig, {});
    expect(merged).toEqual(fileConfig);
  });
});
