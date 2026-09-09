# Dependency patches

These patches apply only to development dependencies. `pnpm security:audit` verifies the installed patched behavior before auditing the lockfile without its advisory allowlist. New advisories or changed package/version/severity boundaries still fail the gate.

- `image-size@2.0.2`: reject non-advancing image parser entries. Verification: `scripts/verify-image-size-patch.mjs`.
- `adm-zip@0.6.0`: reject existing destination symlinks (root, directory, file and dangling link) in extraction, with callback/Promise error propagation. Verification: `scripts/verify-adm-zip-patch.mjs` tests all extraction entry points and ordinary Firefox profile ZIP operations. This addresses [GHSA-vwc7-r8mq-g2x9](https://github.com/advisories/GHSA-vwc7-r8mq-g2x9); version 0.6.1 was not published in npm when checked on 2026-09-09. Use private extraction directories: path checks do not protect against another process concurrently replacing parent directories. Replace this patch with a verified upstream release when available.
