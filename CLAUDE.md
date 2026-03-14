# CLAUDE.md — Project Rules for docscraper-ai

## Architecture

This project follows **SOLID principles** with **dependency injection** via constructor and **factory functions**.

### Before implementing any solution:
1. Draw a **class diagram** (Mermaid format) showing interfaces, classes, and their relationships
2. Identify which **design patterns** apply (Strategy, Factory, Repository, Command, etc.)
3. Define the **folder structure** for new modules before writing code
4. Get alignment on the approach before coding

### Folder Structure

```
src/
  interfaces/     # Pure interfaces (no implementations)
  types/          # Branded types and domain types
  schemas/        # Zod runtime validation schemas
  http/           # HTTP client implementations (Strategy pattern)
  parsing/        # HTML parsing and conversion (Strategy pattern)
  discovery/      # Documentation discovery logic
  crawling/       # Web crawler with DI
  generation/     # Content generation and file writing
  cli/            # CLI entry points
    commands/     # One file per command (Command pattern)
  factories.ts    # Factory functions to wire dependency graphs
  index.ts        # Public API barrel exports

tests/
  unit/           # Pure function tests, no mocking needed
  integration/    # Tests with mocked interfaces
```

## Code Style

### TypeScript Rules
- **Branded types** for all domain primitives (`Url`, `Slug`, `Milliseconds`, etc.) — never use raw `string` or `number` for domain values
- **Zod schemas** for runtime validation at system boundaries (user input, external APIs)
- **`import type`** for type-only imports — enforced by ESLint `consistent-type-imports`
- **No `any`** — enforced by ESLint `no-explicit-any: error`
- **No `^` in dependency versions** — all versions pinned exact

### SOLID Principles
- **S**: Each class/module has one responsibility. Crawler crawls, Parser parses, Writer writes.
- **O**: New HTTP clients or parsers are added by implementing interfaces, not modifying existing code.
- **L**: All implementations of an interface are interchangeable (FetchHttpClient, AxiosHttpClient, UndiciHttpClient).
- **I**: Interfaces are small and focused (IHttpClient, IRateLimiter, IConcurrencyLimiter — not one giant interface).
- **D**: Core classes depend on interfaces, not implementations. Dependencies injected via constructor.

### Design Patterns in Use
- **Strategy**: IHttpClient, ISearchEngine, IHtmlParser, IHtmlConverter, ILinkExtractor
- **Factory**: `createDefaultCrawler()`, `createDefaultDiscoverer()` in `factories.ts`
- **Repository/Writer**: IContentWriter separates I/O from pure generation logic
- **Command**: CLI commands as separate modules with `execute()` functions
- **Constructor DI**: No `new` inside core classes — all deps passed via constructor

### Functions vs Classes
- **Pure functions stay as functions** — `filterLinks`, `buildTree`, `pathToSlug`, `scoreResults`, `generateIndex`, `generatePageFile`
- **Classes only when they hold state or implement an interface** — Crawler, Discoverer, TurndownConverter
- **No unnecessary class wrappers** around stateless logic

### Testing
- **Unit tests**: Pure functions, no mocking. Located in `tests/unit/`.
- **Integration tests**: Mock interfaces (not implementations). Located in `tests/integration/`.
- **Never test trivial wrappers** (FsContentWriter, FetchHttpClient) — they make real I/O calls.
- Use `vitest` for all tests.

## Commit Convention

Follow **Conventional Commits** — semantic-release uses them for automatic versioning:

- `fix: <description>` → PATCH release
- `feat: <description>` → MINOR release
- `feat!: <description>` or `BREAKING CHANGE:` footer → MAJOR release
- `chore:`, `docs:`, `test:`, `refactor:`, `perf:` → no release (unless `refactor:` is in `.releaserc.json` rules)

## Pre-commit Hooks

Husky runs on every commit:
1. `pnpm install` — syncs lockfile
2. `lint-staged` — ESLint fix + Prettier on staged `.ts` files

## CI/CD

- **PR**: `ci.yml` runs lint + format:check + build + test
- **Push to main**: `release.yml` runs CI, then semantic-release auto-publishes to NPM
- All workflows use pnpm with `--frozen-lockfile --prefer-offline`

## Public API

These exports must remain backwards compatible:
- `WebScraper` (alias for `Crawler`)
- `Discoverer`
- `buildTree`
- `generateSkillTree`
- `createDefaultCrawler`
- `createDefaultDiscoverer`
