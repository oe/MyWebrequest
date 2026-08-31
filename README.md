# My Webrequest

A local-first browser extension for creating, testing, and managing request rules. The current rewrite
uses Manifest V3, WXT, React, TypeScript, Tailwind CSS, and shadcn's default `radix-nova` style with a
restrained translucent material layer.

## Current milestone

- Manifest V3 extension shell with optional host permissions
- Split-pane rule manager and compact popup
- Block, redirect, request-header, and HTTPS-upgrade rule models
- URL matching, validation, DNR compilation, storage, and runtime reconciliation
- Unit tests and production build checks
- Chrome, Edge, and Firefox Manifest V3 build targets

Legacy migration, import/export, localization, and real-browser extension E2E coverage remain planned
before a production release. See [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[BROWSER_SUPPORT.md](BROWSER_SUPPORT.md), and [MIGRATION.md](MIGRATION.md).

## Development

Requirements: Node.js 24 and pnpm 11.

```bash
pnpm install
pnpm dev
```

Load `.output/chrome-mv3-dev` as an unpacked extension when developing against Chrome.

Run the complete local quality gate with:

```bash
pnpm check
```

Build one target or the complete browser matrix with:

```bash
pnpm build:chrome
pnpm build:edge
pnpm build:firefox
pnpm build:browsers
```

Artifacts are written to `.output/chrome-mv3`, `.output/edge-mv3`, and `.output/firefox-mv3`.
