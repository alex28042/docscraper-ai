import * as fs from 'fs';
import * as path from 'path';
import { CliConfigSchema } from '../schemas/cli-config';
import type { CliConfig } from '../schemas/cli-config';
import { ConfigFileError } from '../errors';

const CONFIG_FILENAME = '.docscraperrc.json';

/** Walk up directories looking for a config file */
export function findConfigFile(startDir?: string): string | null {
  let dir = startDir ?? process.cwd();

  while (true) {
    const candidate = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached root
    dir = parent;
  }

  return null;
}

/** Load and validate config from the nearest config file */
export function loadConfig(startDir?: string): CliConfig {
  const configPath = findConfigFile(startDir);
  if (!configPath) return {};

  const raw = fs.readFileSync(configPath, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as unknown;
    return CliConfigSchema.parse(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ConfigFileError(configPath, `Invalid config file ${configPath}: ${message}`);
  }
}

/** Merge file config with CLI flags. CLI flags take precedence. */
export function mergeConfig(fileConfig: CliConfig, cliFlags: Partial<CliConfig>): CliConfig {
  const merged: CliConfig = { ...fileConfig };

  for (const [key, value] of Object.entries(cliFlags)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

export type { CliConfig };
