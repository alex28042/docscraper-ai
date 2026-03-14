import { z } from 'zod';
import type {
  Url,
  Slug,
  Milliseconds,
  RequestsPerSecond,
  ConcurrencyLevel,
  CrawlDepth,
  MaxPages,
  RegexPattern,
  HtmlContent,
  MarkdownContent,
  UserAgent,
  PageTitle,
  MetaDescription,
  FilePath,
  DirectoryPath,
} from '../types/branded';

export const UrlSchema = z
  .string()
  .url('Must be a valid URL')
  .transform((v: string) => v as Url);

export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:--[a-z0-9-]+)*$|^index$|^$/, 'Must be a valid slug')
  .transform((v: string) => v as Slug);

export const MillisecondsSchema = z
  .number()
  .int()
  .positive('Must be a positive integer')
  .transform((v: number) => v as Milliseconds);

export const RequestsPerSecondSchema = z
  .number()
  .nonnegative('Must be >= 0')
  .transform((v: number) => v as RequestsPerSecond);

export const ConcurrencyLevelSchema = z
  .number()
  .int()
  .min(1, 'Must be at least 1')
  .transform((v: number) => v as ConcurrencyLevel);

export const CrawlDepthSchema = z
  .number()
  .int()
  .nonnegative('Must be >= 0')
  .transform((v: number) => v as CrawlDepth);

export const MaxPagesSchema = z
  .number()
  .int()
  .positive('Must be at least 1')
  .transform((v: number) => v as MaxPages);

export const RegexPatternSchema = z
  .string()
  .refine(
    (v: string) => {
      try {
        new RegExp(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid regex pattern' },
  )
  .transform((v: string) => v as RegexPattern);

export const HtmlContentSchema = z.string().transform((v: string) => v as HtmlContent);

export const MarkdownContentSchema = z.string().transform((v: string) => v as MarkdownContent);

export const UserAgentSchema = z
  .string()
  .min(1, 'Must not be empty')
  .transform((v: string) => v as UserAgent);

export const PageTitleSchema = z.string().transform((v: string) => v as PageTitle);

export const MetaDescriptionSchema = z.string().transform((v: string) => v as MetaDescription);

export const FilePathSchema = z
  .string()
  .min(1, 'Must not be empty')
  .transform((v: string) => v as FilePath);

export const DirectoryPathSchema = z
  .string()
  .min(1, 'Must not be empty')
  .transform((v: string) => v as DirectoryPath);
