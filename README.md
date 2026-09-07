# RequestOrbit

A local-first browser extension for creating, testing, and managing request rules. The current rewrite
uses Manifest V3, WXT, React, TypeScript, Tailwind CSS, and shadcn's default `radix-nova` style with a
restrained translucent material layer.

The active release objective and milestone gates are documented in [GOAL.md](GOAL.md).

## Implemented baseline

- Dedicated Create redirect button and Other rules menu in the toolbar and empty state.
  Blocking, HTTPS upgrades and request headers open their corresponding editors directly.

- Two-address redirect builder for creation and editing: choose an exact URL or, when only the
  hostname differs, all pages on the original origin. Host replacement preserves paths and queries
  using native DNR transforms; ordinary exact rules use case-sensitive URL filters. Test additional
  URLs before saving. Recognizable rules reopen in a simple editor; advanced replacements are reviewed
  and staged in the draft. New forms default to Enabled; users may switch it off before saving. Saving enabled rules uses the existing permission and conflict checks.
- Manifest V3 extension shell with optional host permissions
- Split-pane rule manager and compact popup
- Block, redirect, request-header removal/set, and HTTPS-upgrade actions
- Basic and advanced URL, resource, method, initiator-domain, priority, and regex conditions
- Transactional storage/DNR reconciliation, browser regex checks, conflict/cycle diagnostics, and quota guard
- Chrome-only deterministic legacy migration with review, export, apply, and rollback; its primary-navigation
  entry appears only while old data needs attention and remains available from Settings otherwise. Edge and
  Firefox omit migration because neither browser had a legacy release. Chrome retains the signed 0.12.11
  identity and reads its `storage.sync` schema plus older page `localStorage` without mutating either source
- Checksummed rule backup, previewed merge/replace import, and automatic recovery snapshot
- English, Simplified Chinese, Korean, Japanese, French, and Spanish UI and manifests
- System-aware light and dark appearance controls shared across extension surfaces, plus a matching persisted
  appearance preference on the product and help site
- Keyboard, reduced-motion, contrast, responsive-layout, unit, artifact, and production build checks
- Isolated Playwright Chromium extension E2E for block and HTTPS-upgrade DNR, quota boundaries, upgrade
  preservation, popup/options synchronization,
  worker restart, bounded permission previews, forced-color/reduced-motion behavior, six-locale keyboard
  switching, legacy migration, and backup recovery
- Chrome, Edge, and Firefox Manifest V3 build targets
- Conservatively remastered original blue-globe icon, browser-size icon matrix, and audited Chrome/Edge
  promotional artwork
- Six-language store descriptions, permission/privacy summaries, search terms, and screenshot captions
- Disabled starter-rule onboarding plus a six-language Astro 7 product and help site with tested Redirect
  recipes and a legacy breaking-change/alternative guide

The current stable-browser matrix and Firefox 142 floor are certified. Chrome 121, Edge 121, signed legacy
upgrade, and store-portal acceptance remain release gates. See [PRODUCT_SPEC.md](PRODUCT_SPEC.md),
[ARCHITECTURE.md](ARCHITECTURE.md), [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md), [MIGRATION.md](MIGRATION.md),
[PRIVACY.md](PRIVACY.md), and [STORE_LISTING.md](STORE_LISTING.md). Use
[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for installed-browser and store certification.

## Support

RequestOrbit is free and open source. If you find it useful, you can
[support the author](https://forth.ink/donate/). Contributions are optional.

## Development

Requirements: Node.js 24, pnpm 11, and OpenSSL for the isolated local HTTPS-upgrade fixture.

```bash
pnpm install
pnpm exec playwright install chromium --no-shell
pnpm dev
```

Load `dist/chrome-dev` as an unpacked extension when developing against Chrome.
The `-dev` directory contains the development build with hot reload; use `dist/chrome`
from `pnpm build:chrome` for standalone use without the development server.

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

Artifacts are written to `dist/chrome`, `dist/edge`, and `dist/firefox`.

Run or build the website with:

```bash
pnpm site:dev
pnpm site:check
pnpm site:build
```

The static site is generated in `site/dist/` and published by `.github/workflows/pages.yml` to
`https://request.forth.ink/` through GitHub Pages. Its source, components, localized copy, and optimized
image inputs live under `site/src/`.

Create checksummed release candidates after the local gate passes:

```bash
pnpm release:package
```

The same command is the CI quality gate. Every successful run uploads the exact Chrome, Edge, Firefox,
and Firefox source archives together with `SHA256SUMS` for installed-browser certification. It also audits
the committed browser-specific 1280x800 listing screenshots against those exact archive checksums. See
[store-assets/README.md](store-assets/README.md) for capture and review instructions.

After changing the product UI, rebuild the browser ZIPs and checksums before capturing new screenshots.
Then regenerate promotional assets with `node scripts/generate-brand-assets.mjs --promo-only`, run
`pnpm generate:store-listing-screenshots`, and run `pnpm generate:site-assets` to refresh the website's
complete product screenshot and social sharing card. Finish with `pnpm release:package`; do not edit
sources while this gate checks archive reproducibility.
