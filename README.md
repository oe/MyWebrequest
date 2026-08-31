# My Webrequest

A local-first browser extension for creating, testing, and managing request rules. The current rewrite
uses Manifest V3, WXT, React, TypeScript, Tailwind CSS, and shadcn's default `radix-nova` style with a
restrained translucent material layer.

The active release objective and milestone gates are documented in [GOAL.md](GOAL.md).

## Implemented baseline

- Manifest V3 extension shell with optional host permissions
- Split-pane rule manager and compact popup
- Block, redirect, request-header removal/set, and HTTPS-upgrade actions
- Basic and advanced URL, resource, method, initiator-domain, priority, and regex conditions
- Transactional storage/DNR reconciliation, browser regex checks, conflict/cycle diagnostics, and quota guard
- Deterministic legacy migration with review, export, apply, and rollback
- Checksummed rule backup, previewed merge/replace import, and automatic recovery snapshot
- English, Simplified Chinese, Korean, Japanese, French, and Spanish UI and manifests
- Keyboard, reduced-motion, contrast, responsive-layout, unit, artifact, and production build checks
- Chrome, Edge, and Firefox Manifest V3 build targets

Installed-extension permission/action/service-worker certification remains required before a production
release or browser support claim. See [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[BROWSER_SUPPORT.md](BROWSER_SUPPORT.md), [MIGRATION.md](MIGRATION.md), [PRIVACY.md](PRIVACY.md), and
[STORE_LISTING.md](STORE_LISTING.md).

## Development

Requirements: Node.js 24 and pnpm 11.

```bash
pnpm install
pnpm dev
```

Load `dist/chrome-mv3-dev` as an unpacked extension when developing against Chrome.

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

Artifacts are written to `dist/chrome-mv3`, `dist/edge-mv3`, and `dist/firefox-mv3`.
