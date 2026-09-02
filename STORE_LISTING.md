# Store Listing Baseline

Last updated: 2026-09-01

## Name

My Webrequest

## Single-purpose statement

My Webrequest lets a user create, test, authorize, and manage local browser request rules.

## Short description

Create local rules to block, redirect, upgrade, or modify matching browser requests.

## Detailed description

My Webrequest is a local-first request-rule manager for developers, QA engineers, support teams, and
advanced users. Its full-page editor makes Manifest V3 request rules understandable without requiring
manual DNR JSON editing.

Supported V1 actions include blocking requests, fixed or capture-based redirects, HTTP-to-HTTPS upgrade,
and removing or setting request headers. Conditions include URL filters, wildcards, regular expressions,
resource types, request methods, initiator domains, and priority.

Rules and settings remain on the device. The extension contains no analytics, account, advertisements,
remote code, or product-owned network service. Website access is optional and requested only for the
specific origins required when a user enables a rule.

Export a checksum-protected JSON backup, preview a safe merge or full replacement before applying it, and
recover the previous state after a replacement. The interface supports six languages, keyboard navigation,
reduced motion, increased contrast, and responsive layouts.

## Chrome-only migration note

Chrome users upgrading from the legacy My Webrequest release can review old data through a deterministic
migration report. Unsupported or removed behavior remains exportable and is never silently activated or
discarded. Do not append this paragraph to Edge or Firefox listings because neither browser had a legacy
release.

## Permission disclosure

The listing must use the explanations in [PRIVACY.md](PRIVACY.md) verbatim in meaning. Screenshots must
show the actual rule manager, permission explanation, and backup entry point from each browser's exact
checksummed release artifact. A migration review image is Chrome-only and should be added only when it helps
existing Chrome users. Do not claim Chrome, Edge, or Firefox support until that browser's installed-extension
certification row in [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md) is complete.

Use the conservatively remastered blue-globe icon and the audited 440x280 promotional tile from
`store-assets/`. Do not substitute an unrelated symbol or upload a resized screenshot as promotional artwork.
