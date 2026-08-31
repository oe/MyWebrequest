# Store Listing Baseline

Last updated: 2026-09-01

## Name

My Webrequest — Request Rules

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

Legacy My Webrequest data can be reviewed through a deterministic migration report. Unsupported or
removed behavior remains exportable and is never silently activated or discarded.

## Permission disclosure

The listing must use the explanations in [PRIVACY.md](PRIVACY.md) verbatim in meaning. Screenshots must
show the actual popup, rule manager, permission explanation, migration review, and backup preview from the
release artifact. Do not claim Chrome, Edge, or Firefox support until that browser's installed-extension
certification row in [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md) is complete.
