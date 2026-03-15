import { z } from 'zod';

export const CliConfigSchema = z.object({
  rateLimit: z.number().positive().optional(),
  concurrency: z.number().int().positive().optional(),
  timeout: z.number().positive().optional(),
  maxDepth: z.number().int().nonnegative().optional(),
  maxPages: z.number().int().positive().optional(),
  httpClient: z.enum(['fetch', 'axios', 'undici', 'playwright']).optional(),
  includePatterns: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
  output: z.string().optional(),
  retry: z.union([z.boolean(), z.object({ maxRetries: z.number().optional() })]).optional(),
  cache: z.boolean().optional(),
  userAgent: z.string().optional(),
});

export type CliConfig = z.infer<typeof CliConfigSchema>;
