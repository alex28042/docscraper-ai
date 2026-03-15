## [1.3.1](https://github.com/Alex28042/docscraper-ai/compare/v1.3.0...v1.3.1) (2026-03-15)

# [1.3.0](https://github.com/Alex28042/docscraper-ai/compare/v1.2.5...v1.3.0) (2026-03-15)


### Features

* add API endpoint detection from HTML documentation ([d0ec0f8](https://github.com/Alex28042/docscraper-ai/commit/d0ec0f8f5e5addde9a836cbd043a70553baf404f))
* add config file support with .docscraperrc.json ([4ff72d4](https://github.com/Alex28042/docscraper-ai/commit/4ff72d45eba9be1812ff5c9fcfa6b9fcb026b777))
* add content deduplication via 64-bit simhash fingerprinting ([e3e4e80](https://github.com/Alex28042/docscraper-ai/commit/e3e4e80f3cef019ce28136015d1cee2626f09ab3))
* add custom exception hierarchy for cleaner error handling ([6b9786c](https://github.com/Alex28042/docscraper-ai/commit/6b9786c35c2e1e1c9d3ea0166a7eeb590d0670cb))
* add diff mode to compare two crawl results ([b36dad5](https://github.com/Alex28042/docscraper-ai/commit/b36dad52826266976677a4658804e246c9958549))
* add domain types and schemas for all new features ([6e57976](https://github.com/Alex28042/docscraper-ai/commit/6e57976af60e6e4d8248cb4f2a09b98a4e909baf))
* add language detection from HTML document attributes ([e3a4728](https://github.com/Alex28042/docscraper-ai/commit/e3a47280b3f9e734a47a5270c4a135590d787031))
* add link validation for internal and external URLs ([8edfa56](https://github.com/Alex28042/docscraper-ai/commit/8edfa561bed70a4ec17460a1e809c1c0213c919b))
* add metadata extraction from HTML meta tags and OG tags ([ef37e7f](https://github.com/Alex28042/docscraper-ai/commit/ef37e7fbfa35ac953b8a18caed15df5279f4da35))
* add Playwright HTTP client for JS-rendered pages ([a71a471](https://github.com/Alex28042/docscraper-ai/commit/a71a4716c123ade45e8809c31abc20854ae8600b))
* add resumable crawls with file-system state persistence ([1b3a93a](https://github.com/Alex28042/docscraper-ai/commit/1b3a93a05a4756fe53b1c6866b6718dc70b95166))
* add structured JSON export with heading tree and code blocks ([e067990](https://github.com/Alex28042/docscraper-ai/commit/e067990884e99ed0d10e4abccd026d0a697702de))
* wire all features into crawler, factories, CLI, and public API ([17621e7](https://github.com/Alex28042/docscraper-ai/commit/17621e738ec3d44734bd00f6921ef8ab9bfac323))

## [1.2.5](https://github.com/Alex28042/docscraper-ai/compare/v1.2.4...v1.2.5) (2026-03-15)


### Performance Improvements

* remove source maps from published package ([4d29245](https://github.com/Alex28042/docscraper-ai/commit/4d2924569e14d4f3811fcac72ee302550d1be49f))

## [1.2.4](https://github.com/Alex28042/docscraper-ai/compare/v1.2.3...v1.2.4) (2026-03-15)


### Performance Improvements

* optimize CI pipeline with cached setup and parallel jobs ([f0b2b56](https://github.com/Alex28042/docscraper-ai/commit/f0b2b568f4f299866791605311b02bf8473eb68a))

## [1.2.3](https://github.com/Alex28042/docscraper-ai/compare/v1.2.2...v1.2.3) (2026-03-15)

## [1.2.2](https://github.com/Alex28042/docscraper-ai/compare/v1.2.1...v1.2.2) (2026-03-15)

## [1.2.1](https://github.com/Alex28042/docscraper-ai/compare/v1.2.0...v1.2.1) (2026-03-15)


### Bug Fixes

* update dependencies and add security audit CI ([27be26f](https://github.com/Alex28042/docscraper-ai/commit/27be26fc45ac8f1f734db72a85e985e13e082548))

# [1.2.0](https://github.com/Alex28042/docscraper-ai/compare/v1.1.0...v1.2.0) (2026-03-15)


### Features

* add HTTP response cache with InMemoryCache, FsCache, and CachedHttpClient decorator ([5c045de](https://github.com/Alex28042/docscraper-ai/commit/5c045de6f83a0474785da39186ffa7c19df53b2f))

# 1.0.0 (2026-03-15)


### Bug Fixes

* add .claude project settings and CLAUDE.md rules ([fb75c91](https://github.com/Alex28042/docscraper-ai/commit/fb75c9168e3319fc59a320ceb99b653948a6d6e6))
* add lockfile sync to pre-commit hook ([73c9a01](https://github.com/Alex28042/docscraper-ai/commit/73c9a018d727e10e93ed6abdac96eb8240d49ec9))
* enforce conventional commits with commitlint and husky commit-msg hook ([4864cc3](https://github.com/Alex28042/docscraper-ai/commit/4864cc389cb4b3f73c8a738152f14c03b16411ec))
* sync pnpm-lock.yaml with pinned dependency versions ([1e40fbe](https://github.com/Alex28042/docscraper-ai/commit/1e40fbe5ba967747d0c22e19bce30cda5fce770d))


### Features

* add branded types, Zod schemas, and migrate to pnpm ([cc31883](https://github.com/Alex28042/docscraper-ai/commit/cc3188306f2fb6b3e0bfcd7b6f3b4be930a66c45))
* add code snippet extraction from HTML documentation ([6454f0c](https://github.com/Alex28042/docscraper-ai/commit/6454f0c7425f05df8327e23cf50e5ab0b1d8bf76))
* add HTTP response cache with InMemoryCache, FsCache, and CachedHttpClient decorator ([5c045de](https://github.com/Alex28042/docscraper-ai/commit/5c045de6f83a0474785da39186ffa7c19df53b2f))
* add progress events with onPageComplete and onCrawlComplete callbacks ([1611197](https://github.com/Alex28042/docscraper-ai/commit/1611197842d1edb6162076829f397f169b3a2aab))
* add RetryHttpClient with exponential backoff and jitter ([0089dfa](https://github.com/Alex28042/docscraper-ai/commit/0089dfae6dc7d3a1e46364bed962e8232832dedf))
* add robots.txt parser with crawl rules and sitemap discovery ([6604e76](https://github.com/Alex28042/docscraper-ai/commit/6604e763552685481d2c4a6b3bf536903834174f))
* add semantic-release for automatic versioning and NPM publishing ([ae50f66](https://github.com/Alex28042/docscraper-ai/commit/ae50f6669d3afb7fbe68e79b1a29a09ddadaf965))
* add single-file markdown export for entire crawl results ([fcb2d74](https://github.com/Alex28042/docscraper-ai/commit/fcb2d748e3e46d55f4934e9ede858b8710a08183))
* add sitemap parser for URL discovery via sitemap.xml ([d26a7de](https://github.com/Alex28042/docscraper-ai/commit/d26a7de032255ad1eabb2b1ee28459086ea8e346))


### Performance Improvements

* optimize CI/CD for speed ([9955646](https://github.com/Alex28042/docscraper-ai/commit/9955646720ad78b2d46e6ddc3be6e33017678321))

# 1.0.0 (2026-03-15)


### Bug Fixes

* add .claude project settings and CLAUDE.md rules ([fb75c91](https://github.com/Alex28042/docscraper-ai/commit/fb75c9168e3319fc59a320ceb99b653948a6d6e6))
* add lockfile sync to pre-commit hook ([73c9a01](https://github.com/Alex28042/docscraper-ai/commit/73c9a018d727e10e93ed6abdac96eb8240d49ec9))
* enforce conventional commits with commitlint and husky commit-msg hook ([4864cc3](https://github.com/Alex28042/docscraper-ai/commit/4864cc389cb4b3f73c8a738152f14c03b16411ec))
* sync pnpm-lock.yaml with pinned dependency versions ([1e40fbe](https://github.com/Alex28042/docscraper-ai/commit/1e40fbe5ba967747d0c22e19bce30cda5fce770d))


### Features

* add branded types, Zod schemas, and migrate to pnpm ([cc31883](https://github.com/Alex28042/docscraper-ai/commit/cc3188306f2fb6b3e0bfcd7b6f3b4be930a66c45))
* add code snippet extraction from HTML documentation ([6454f0c](https://github.com/Alex28042/docscraper-ai/commit/6454f0c7425f05df8327e23cf50e5ab0b1d8bf76))
* add HTTP response cache with InMemoryCache, FsCache, and CachedHttpClient decorator ([5c045de](https://github.com/Alex28042/docscraper-ai/commit/5c045de6f83a0474785da39186ffa7c19df53b2f))
* add progress events with onPageComplete and onCrawlComplete callbacks ([1611197](https://github.com/Alex28042/docscraper-ai/commit/1611197842d1edb6162076829f397f169b3a2aab))
* add RetryHttpClient with exponential backoff and jitter ([0089dfa](https://github.com/Alex28042/docscraper-ai/commit/0089dfae6dc7d3a1e46364bed962e8232832dedf))
* add robots.txt parser with crawl rules and sitemap discovery ([6604e76](https://github.com/Alex28042/docscraper-ai/commit/6604e763552685481d2c4a6b3bf536903834174f))
* add semantic-release for automatic versioning and NPM publishing ([ae50f66](https://github.com/Alex28042/docscraper-ai/commit/ae50f6669d3afb7fbe68e79b1a29a09ddadaf965))
* add single-file markdown export for entire crawl results ([fcb2d74](https://github.com/Alex28042/docscraper-ai/commit/fcb2d748e3e46d55f4934e9ede858b8710a08183))
* add sitemap parser for URL discovery via sitemap.xml ([d26a7de](https://github.com/Alex28042/docscraper-ai/commit/d26a7de032255ad1eabb2b1ee28459086ea8e346))


### Performance Improvements

* optimize CI/CD for speed ([9955646](https://github.com/Alex28042/docscraper-ai/commit/9955646720ad78b2d46e6ddc3be6e33017678321))

# 1.0.0 (2026-03-15)


### Bug Fixes

* add .claude project settings and CLAUDE.md rules ([fb75c91](https://github.com/Alex28042/docscraper-ai/commit/fb75c9168e3319fc59a320ceb99b653948a6d6e6))
* add lockfile sync to pre-commit hook ([73c9a01](https://github.com/Alex28042/docscraper-ai/commit/73c9a018d727e10e93ed6abdac96eb8240d49ec9))
* enforce conventional commits with commitlint and husky commit-msg hook ([4864cc3](https://github.com/Alex28042/docscraper-ai/commit/4864cc389cb4b3f73c8a738152f14c03b16411ec))
* sync pnpm-lock.yaml with pinned dependency versions ([1e40fbe](https://github.com/Alex28042/docscraper-ai/commit/1e40fbe5ba967747d0c22e19bce30cda5fce770d))


### Features

* add branded types, Zod schemas, and migrate to pnpm ([cc31883](https://github.com/Alex28042/docscraper-ai/commit/cc3188306f2fb6b3e0bfcd7b6f3b4be930a66c45))
* add code snippet extraction from HTML documentation ([6454f0c](https://github.com/Alex28042/docscraper-ai/commit/6454f0c7425f05df8327e23cf50e5ab0b1d8bf76))
* add progress events with onPageComplete and onCrawlComplete callbacks ([1611197](https://github.com/Alex28042/docscraper-ai/commit/1611197842d1edb6162076829f397f169b3a2aab))
* add RetryHttpClient with exponential backoff and jitter ([0089dfa](https://github.com/Alex28042/docscraper-ai/commit/0089dfae6dc7d3a1e46364bed962e8232832dedf))
* add robots.txt parser with crawl rules and sitemap discovery ([6604e76](https://github.com/Alex28042/docscraper-ai/commit/6604e763552685481d2c4a6b3bf536903834174f))
* add semantic-release for automatic versioning and NPM publishing ([ae50f66](https://github.com/Alex28042/docscraper-ai/commit/ae50f6669d3afb7fbe68e79b1a29a09ddadaf965))
* add single-file markdown export for entire crawl results ([fcb2d74](https://github.com/Alex28042/docscraper-ai/commit/fcb2d748e3e46d55f4934e9ede858b8710a08183))
* add sitemap parser for URL discovery via sitemap.xml ([d26a7de](https://github.com/Alex28042/docscraper-ai/commit/d26a7de032255ad1eabb2b1ee28459086ea8e346))


### Performance Improvements

* optimize CI/CD for speed ([9955646](https://github.com/Alex28042/docscraper-ai/commit/9955646720ad78b2d46e6ddc3be6e33017678321))

# [1.1.0](https://github.com/Alex28042/docscraper-ai/compare/v1.0.3...v1.1.0) (2026-03-14)


### Features

* add code snippet extraction from HTML documentation ([259dfcb](https://github.com/Alex28042/docscraper-ai/commit/259dfcb0f4024d1735ea5b8674929ecc5301b10e))
* add progress events with onPageComplete and onCrawlComplete callbacks ([15de0eb](https://github.com/Alex28042/docscraper-ai/commit/15de0eb52092c4c46660cc27f95d3f7fb3da9f53))
* add RetryHttpClient with exponential backoff and jitter ([8f9371e](https://github.com/Alex28042/docscraper-ai/commit/8f9371e2a55cd64f60f70c41d019af4664da8bdb))
* add robots.txt parser with crawl rules and sitemap discovery ([ecfc2d7](https://github.com/Alex28042/docscraper-ai/commit/ecfc2d775c9e3831c47045d79ca6665ba65a764f))
* add single-file markdown export for entire crawl results ([a0cd2be](https://github.com/Alex28042/docscraper-ai/commit/a0cd2befc013ae5ecf9e9f00a3931c64bba924d9))
* add sitemap parser for URL discovery via sitemap.xml ([4c4578d](https://github.com/Alex28042/docscraper-ai/commit/4c4578d5d335c2c8d0f844e478c882a3a22b2503))

## [1.0.3](https://github.com/Alex28042/docscraper-ai/compare/v1.0.2...v1.0.3) (2026-03-14)


### Bug Fixes

* enforce conventional commits with commitlint and husky commit-msg hook ([e07b195](https://github.com/Alex28042/docscraper-ai/commit/e07b195637bae8f74b25c13f1b01967e052404a6))

## [1.0.2](https://github.com/Alex28042/docscraper-ai/compare/v1.0.1...v1.0.2) (2026-03-14)


### Bug Fixes

* add .claude project settings and CLAUDE.md rules ([daad953](https://github.com/Alex28042/docscraper-ai/commit/daad953ab9a5f90a48d7d3978090e067102bf1f3))

## [1.0.1](https://github.com/Alex28042/docscraper-ai/compare/v1.0.0...v1.0.1) (2026-03-14)


### Bug Fixes

* add lockfile sync to pre-commit hook ([189b138](https://github.com/Alex28042/docscraper-ai/commit/189b1380ad2319419e901a91a604ccf8695a3656))

# 1.0.0 (2026-03-14)


### Bug Fixes

* sync pnpm-lock.yaml with pinned dependency versions ([ee234bb](https://github.com/Alex28042/docscraper-ai/commit/ee234bbae9958b3da321ba74bd00925521638b19))


### Features

* add branded types, Zod schemas, and migrate to pnpm ([63ba996](https://github.com/Alex28042/docscraper-ai/commit/63ba996e1cad77be96dea3916ec31d4c23663765))
* add semantic-release for automatic versioning and NPM publishing ([ea06c09](https://github.com/Alex28042/docscraper-ai/commit/ea06c09d02a22b0b3c963f67fa8ec6a3edaedc51))


### Performance Improvements

* optimize CI/CD for speed ([91161a9](https://github.com/Alex28042/docscraper-ai/commit/91161a98f1786ca44684d44cabec6052acee610a))
