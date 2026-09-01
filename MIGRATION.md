# My Webrequest Legacy Migration Plan

Status: Implemented and regression-tested; signed-store upgrade validation pending
Last updated: 2026-09-02
Related documents: [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_BRIEF.md](DESIGN_BRIEF.md)

## 1. Migration promise

The migration may reduce legacy behavior where Chrome MV3 cannot express it, but it must never silently discard, enable, broaden, or alter a user's rule.

This workstream is Chrome-only. The legacy extension was never released for Edge or Firefox, so those
artifacts do not expose migration UI or run legacy-data detection. Their normal backup import remains
available for portable current-format rule data.

Every legacy item receives an explicit outcome:

- `automatic`: same intended effect can be represented safely.
- `review-required`: convertible with a visible semantic difference.
- `unsupported`: intent is preserved as data but cannot be enabled.
- `removed-feature`: the old feature no longer exists.
- `invalid`: the source data cannot be parsed safely.

## 2. Legacy identity evidence and remaining precondition

- Repository commit `9527c62` contains a signed CRX2 artifact for version `0.12.11`. Its SHA-256 is
  `77a52761f09dd8aaf71bcb5f16da220565c132dea4c18422fdf3292be4281e69`; its embedded RSA signature
  verifies against its embedded public key.
- That public key derives Chrome extension ID `jaghnfjaikbcdliekgchjeeklkeceell`. The Chrome-only MV3
  manifest carries the same public key, and artifact preflight independently derives and checks the ID.
- The same-ID upgrade E2E harness persists the `0.12.11` `storage.sync` fixture, overlays the production
  build in the same profile, and proves that the MV3 options page stages the preserved data. This is
  deterministic same-identity unpacked evidence, not a substitute for a Chrome Web Store signed update.
- Final release still requires installing the actual previous public package and receiving the new signed
  package through the production store ID. If the portal identity differs from the recorded signed CRX,
  automatic access is unavailable and JSON import becomes the supported fallback.

## 3. Legacy sources

The legacy MV2/CoffeeScript implementation was removed from the active working tree after this inventory
was documented. Commit `e100dbf` is the final pre-cleanup snapshot for migration archaeology; legacy code
must not be copied back into the runtime or build.

The final signed repository artifact stores current data in `chrome.storage.sync`. Its own migration code
copied older page `localStorage` data into sync storage without deleting the page-storage source, so V1 reads
both stores without mutating either. Sync data takes precedence; non-overlapping rule collections are merged,
and conflicting page-storage values remain explicit exportable report items.

Known legacy keys across both generations are:

- `block`
- `hsts`
- `hotlink`
- `log`
- `custom`
- `cors`
- `contextmenu`
- `ua`
- `ua-list`
- `gsearch`
- `gstatic`
- `onoff`
- `config`
- `version`

Legacy imports may contain arbitrary additional keys. Unknown keys are retained in the raw snapshot but never copied into active storage.

## 4. Target migration artifacts

```ts
type MigrationReport = {
  migrationVersion: 1;
  source: 'legacy-local-storage' | 'legacy-chrome-storage' | 'legacy-json-import';
  sourceFingerprint: string;
  createdAt: string;
  items: MigrationItem[];
  summary: {
    automatic: number;
    reviewRequired: number;
    unsupported: number;
    removedFeature: number;
    invalid: number;
  };
};
```

The report stores source text only in the bounded local migration snapshot. UI-facing report items use escaped text and typed fields.

## 5. Mapping matrix

| Legacy category              | Target                                  | Default migration outcome                                  |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `block`                      | Block action                            | Automatic when filter is valid                             |
| `hsts`                       | Advanced upgrade-scheme action          | Automatic but surfaced as consolidated capability          |
| `hotlink`                    | Preserved legacy record                 | Unsupported until bounded initiator domains are chosen     |
| `custom`                     | Navigation-only fixed or regex redirect | Review required or unsupported per grammar                 |
| `cors`                       | No target                               | Removed global response/request-header override            |
| `contextmenu`                | No target                               | Removed programmable context-menu action                   |
| `ua` / `ua-list`             | No target                               | Removed User-Agent override and preset data                |
| `log`                        | No target                               | Removed feature                                            |
| `gsearch`                    | Ordinary redirect preset                | Review required and disabled by default                    |
| `gstatic`                    | No target                               | Removed feature; endpoint is obsolete                      |
| `onoff`                      | Enabled intent                          | Preserved only after rule conversion and permission review |
| `config.iconStyle`           | No target                               | Removed preference                                         |
| demo/custom onboarding flags | No target                               | Ignored after recording in raw snapshot                    |

No migrated rule is enabled before required host permissions are granted.

## 6. Custom URL compatibility

Legacy Custom URL rules can extract named placeholders from host, path, and query values and construct a new URL. MV3 DNR supports a narrower regex substitution model.

### Automatic

- Fixed source filter to fixed destination.
- Host/path wildcard that maps to a DNR URL filter without changing scope.
- Path placeholders that compile to supported capture groups and substitutions.
- Query transformations that can be expressed without order-independent parsing.

### Review required

- Broader DNR match scope than the legacy filter.
- Encoding behavior changes between legacy placeholder filling and DNR substitution.
- Upgrade from explicit HTTP to scheme-agnostic matching.
- Legacy rule depends on a query order that the converted regex now fixes.

### Unsupported

- Order-independent extraction from arbitrary query parameters when DNR cannot preserve the same semantics.
- More capture groups than DNR substitution supports.
- Unsupported RE2 syntax or excessive regex memory.
- Redirect schemes outside the allowed V1 set.
- Dynamic computation that requires JavaScript execution for each request.

The migration UI shows the original match, original destination template, generated rule, warnings, and at least one user-provided or preserved test URL where available.

## 7. Migration execution

### Stage A: Detect

- Check for a completed migration marker tied to a source fingerprint.
- Check new storage before attempting legacy access.
- Read `chrome.storage.sync` and page `localStorage` once through the validated Chrome-only adapters.
- Never mutate legacy storage during detection.
- Prefer automatic detection from an extension page on a same-ID update; use JSON import as the fallback
  when the legacy origin is inaccessible.

### Stage B: Parse

- Parse each known key independently.
- Apply size, count, depth, and string-length limits.
- Preserve parse errors per key instead of failing the whole migration.
- Compute a fingerprint over canonicalized source data for idempotency.

### Stage C: Classify

- Convert each item through a pure migration function.
- Compile candidate target rules without installing them.
- Run schema, permission, regex-support, conflict, and cycle checks.
- Produce the report and proposed target state.

### Stage D: Review

- Show summary first, then filterable item details.
- Keep automatic items selected by default.
- Keep review-required and unsupported items disabled by default.
- Never preselect removed or invalid items.
- Allow export of the complete report and raw snapshot.

### Stage E: Authorize and apply

- Request permissions only for selected rules that the user chooses to enable.
- Apply converted DNR rules in bounded batches.
- Persist the target state and completed marker only after successful application.
- If application fails, remove newly applied rules and leave the migration pending.

### Stage F: Retain and clean up

- Retain one migration snapshot and report locally.
- Do not delete legacy storage automatically in V1.
- Offer explicit cleanup only after the user has exported or confirmed the migration.

## 8. Import migration

Legacy JSON import follows the same parser/classifier as automatic migration.

- The user chooses merge or replace after preview.
- Replace creates a pre-import snapshot.
- Duplicate identity is determined by normalized condition/action fingerprint, not display name.
- Conflicts are presented individually.
- Imported enabled flags express user intent but do not bypass permission requests.

## 9. Failure and recovery

| Failure                   | Behavior                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| One key has invalid JSON  | Continue other keys; retain error and raw text                      |
| One rule is unsupported   | Continue other rules; retain it disabled/exportable                 |
| Permission denied         | Save rule as `needs-permission`; do not install it                  |
| DNR quota reached         | Apply safe subset only after explicit review; otherwise abort batch |
| DNR update fails          | Compensate applied changes and keep previous target state           |
| Storage commit fails      | Remove new DNR rules and preserve old state                         |
| Worker terminates mid-run | Resume from idempotent staged state and source fingerprint          |
| User closes migration UI  | Keep report pending; apply nothing unconfirmed                      |

## 10. Migration test corpus

Fixtures must include:

- Empty and partially populated installations.
- Every legacy category enabled and disabled.
- Duplicate and overlapping block filters.
- Hyphenated domains from the historical bug report.
- Wildcard subdomains and paths.
- Named path and splat placeholders.
- Query placeholders in different orders.
- Encoded Unicode and malformed percent encoding.
- Arrays and repeated query keys.
- Redirect loops and chains.
- Invalid JSON, unknown keys, oversized values, and malicious HTML strings.
- Import from both English and Chinese installations.
- Object-shaped rule arrays and `storage.sync` settings from the signed `0.12.11` source schema.
- Coexisting sync and page-storage collections, including deterministic conflicts.

For every fixture, tests assert report counts, candidate rules, permission origins, default selection, and absence of silent loss.

## 11. Migration acceptance gate

- Running the migration twice produces the same report and no duplicate rules.
- Closing or terminating the worker at any stage does not create partial active state.
- Every source item is represented in the final report.
- Automatic conversions have behavior-focused unit and E2E tests.
- Review-required conversions remain disabled until confirmed.
- Unsupported and invalid source values are exportable but never rendered as HTML.
- A replace import can restore the pre-import snapshot.
