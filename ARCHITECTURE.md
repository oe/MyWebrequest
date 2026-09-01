# My Webrequest 2 Architecture

Status: Approved implementation baseline  
Last updated: 2026-09-01  
Related documents: [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [MIGRATION.md](MIGRATION.md), [DESIGN_BRIEF.md](DESIGN_BRIEF.md)

## 1. Architectural goals

- Manifest V3 only across Chrome, Edge, and Firefox targets.
- Correct behavior under an ephemeral extension service worker.
- Minimum installation permissions and per-origin optional grants.
- A pure, testable rule domain independent of Chrome APIs and React.
- Deterministic migration and reproducible builds.
- No remote runtime dependency or user-data transmission.
- Small, reviewable surface area that can remain maintained for years.

## 2. Technology baseline

| Area            | Decision                                             | Rationale                                                                               |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Runtime         | Node.js 24 LTS                                       | Supported production baseline; avoid non-LTS/EOL Node releases                          |
| Package manager | pnpm with committed lockfile                         | Deterministic installs and efficient dependency management                              |
| Extension build | WXT, Chrome/Edge/Firefox MV3 targets                 | Manifest generation, shared entrypoints, Vite integration, extension-aware testing      |
| Language        | TypeScript strict                                    | Typed domain models and safer Chrome API integration                                    |
| UI              | React for popup/options only                         | Existing team familiarity and component/state needs without putting React in the worker |
| Styling         | Tailwind CSS v4 plus shadcn `radix-nova` tokens      | Local CSS variables and utilities, no runtime CSS-in-JS                                 |
| Unit tests      | Vitest                                               | Fast pure-domain and component tests                                                    |
| E2E             | Playwright Chromium                                  | Real extension installation, downloads, storage, DNR, and service-worker testing        |
| Validation      | Versioned JSON Schema with a typed runtime validator | Treat imports and legacy data as untrusted                                              |
| CI              | GitHub Actions on Node 24                            | Typecheck, lint, unit, per-browser E2E, build, artifact and store-validator audit       |

Exact dependency versions are pinned in the committed lockfile and upgraded only through the complete
quality gate. `latest` ranges are not permitted.

## 3. Repository target shape

```text
src/
  entrypoints/
    background.ts
    popup/
      index.html
      main.tsx
      style.css
    options/
      index.html
      main.tsx
      style.css
  domain/
    rules/
      model.ts
      schema.ts
      validate.ts
      compile-dnr.ts
      conflicts.ts
      test-match.ts
    migration/
      legacy-schema.ts
      parse-legacy.ts
      classify.ts
  application/
    rule-service.ts
    permission-service.ts
    migration-service.ts
    transfer-service.ts
  infrastructure/
    chrome-dnr.ts
    chrome-storage.ts
    chrome-permissions.ts
    legacy-local-storage.ts
  ui/
    components/
    hooks/
    rules/
    surfaces/
      options-app.tsx
      popup-app.tsx
    styles.css
  public/
    _locales/
    icon/
tests/
  fixtures/
  unit/
  integration/
  e2e/
```

WXT uses `src/` as its source root. Entrypoints contain only browser/page bootstrap adapters; UI composition,
application behavior, domain logic, infrastructure adapters, and copied extension assets all live beneath `src/`.
WXT-generated directories and `dist/` build output are ignored. Source code contains no generated manifest or
compiled JavaScript.

## 4. Layer responsibilities

### Domain

- Owns the versioned internal rule model.
- Validates conditions and actions.
- Compiles internal rules to Chrome DNR rules.
- Detects local conflicts and redirect cycles.
- Parses and classifies legacy formats.
- Has no imports from React, WXT, or `chrome.*`.

### Application

- Coordinates domain operations and infrastructure adapters.
- Implements create, update, enable, disable, delete, import, export, and migrate use cases.
- Converts failures into typed user-facing outcomes.
- Defines transaction boundaries between storage, permissions, and DNR.

### Infrastructure

- Contains every `chrome.*` call.
- Persists data in `chrome.storage.local`.
- Applies DNR updates and reads DNR quota state.
- Requests and checks optional host permissions.
- Reads legacy `localStorage` only during migration.

### UI

- Renders application state and invokes application commands.
- Does not construct raw DNR rules.
- Does not call `chrome.*` directly except through a thin surface bootstrap where unavoidable.
- Never inserts untrusted strings with `innerHTML`.

## 5. Manifest and permissions

Target manifest principles:

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "declarativeNetRequest"],
  "optional_host_permissions": ["http://*/*", "https://*/*"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}
```

This is an architectural sketch, not the final generated manifest.

The DNR permission lets safe block and HTTPS-upgrade rules run without host access. Redirect and
request-header rules request the matched URL origin; non-navigation rules additionally require explicit
initiator domains and request those origins. This avoids silently installing ineffective rules or asking
for unbounded initiator access.

WXT generates the manifest from a browser-aware function. Firefox MV3 additionally declares a stable
Gecko extension ID and `data_collection_permissions.required: ["none"]`; the latter truthfully reflects
the local-only architecture and is required for new AMO submissions. Chrome and Edge share the Chromium
manifest shape. See [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md) for release gates.

Rules:

- No required `<all_urls>` host permission.
- Add an API permission only with an implemented feature and a documented reason.
- Request origins through `chrome.permissions.request()` inside a direct user gesture.
- Recompute affected rule state after `permissions.onAdded` and `permissions.onRemoved`.
- Avoid `tabs` unless an implementation spike proves `activeTab` is insufficient for popup current-site context.
- Add `offscreen` only if the automatic legacy migration spike proves it is required; otherwise migrate from an extension page.
- No content scripts in V1.

## 6. Rule model

The product owns a browser-independent model and treats DNR as a compiled target.

```ts
type Rule = {
  schemaVersion: 1;
  id: string;
  dnrId: number;
  name: string;
  enabled: boolean;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
  permissionOrigins: string[];
  createdAt: string;
  updatedAt: string;
};

type RuleCondition = {
  url: { kind: 'filter'; value: string } | { kind: 'regex'; value: string };
  resourceTypes?: string[];
  requestMethods?: string[];
  initiatorDomains?: string[];
};

type RuleAction =
  | { kind: 'block' }
  | { kind: 'redirect'; target: RedirectTarget }
  | { kind: 'upgrade-scheme' }
  | { kind: 'modify-request-headers'; operations: HeaderOperation[] };
```

The concrete TypeScript types must use Chrome's current DNR string unions rather than duplicating them manually where practical.

## 7. DNR compiler

The compiler is a pure function:

```text
Internal Rule + granted origins + capability limits
  -> compiled DNR rule
  -> warnings
  -> required permissions
  -> compatibility result
```

Responsibilities:

- Produce stable positive integer DNR IDs.
- Compile filter and regex conditions.
- Restrict regex substitution to DNR-supported capture semantics.
- Call the infrastructure capability check for `isRegexSupported` before enable.
- Use `testMatchOutcome` for the editor's URL test when available.
- Calculate rule safety class and quota usage.
- Reject self-redirect and known multi-rule cycles.
- Exclude every member of a same-condition priority conflict instead of relying on browser precedence.
- Allocate the internal 4,500-rule safety quota deterministically from stored rule order. Missing permissions or
  unsupported regex syntax do not reshuffle quota ownership during a lifecycle event.
- Return typed errors; never catch-and-ignore compiler failures.

Compiler output is snapshot-tested. A change to compiled DNR JSON requires explicit test review.

## 8. Storage model

`chrome.storage.local` is the source of truth.

```ts
type StoredState = {
  schemaVersion: 1;
  rules: Record<string, Rule>;
  order: string[];
  settings: Settings;
  migration?: MigrationState;
  snapshots: SnapshotMetadata[];
};
```

Storage rules:

- Persist only JSON-compatible data.
- Validate on every import and storage-version migration.
- Use one application command for storage and DNR changes.
- On update, compile first, apply DNR second, then persist the committed representation; compensate if a later step fails.
- Keep bounded snapshots for destructive import/migration operations, not routine edits.
- Never store browsing activity or request contents.
- Use ISO timestamps for portability; do not derive rule priority from timestamps.

## 9. Service worker behavior

- Register event listeners synchronously at module top level.
- Hydrate required state inside individual handlers.
- Treat global variables only as disposable caches.
- Do not use keepalive timers.
- Make initialization idempotent so install, update, browser startup, or worker restart can repeat safely.
- Reconcile stored enabled rules with installed dynamic rules at startup/update.
- Record only bounded local diagnostic events without URL/query contents.
- Surface reconciliation failures in the rule manager.

## 10. Permission state model

Each enabled rule has one of these operational states:

- `active`: compiled, installed, and permitted.
- `disabled`: intentionally off.
- `needs-permission`: valid but missing one or more origins.
- `invalid`: schema or semantic failure.
- `unsupported`: valid legacy intent that DNR cannot express.
- `conflicted`: locally shadowed or in a redirect cycle.
- `quota-blocked`: valid but not installed because a limit was reached.

UI state must be derived from stored rule, grant state, compiler result, and installed DNR state; it must not be persisted as an independent truth.

## 11. Security controls

- Treat imports, migrated strings, URLs, names, and headers as untrusted data.
- Render user text as text nodes only.
- Enforce local-only Content Security Policy.
- Bundle all code, fonts, icons, and assets.
- Reject dangerous or unsupported redirect schemes.
- Validate header names and restrict forbidden headers according to Chrome DNR.
- Redact URL query/fragment from diagnostics.
- No runtime `eval`, `new Function`, remote modules, or inline scripts.
- Review production ZIP contents in CI.
- Maintain an explicit dependency allowlist and automated vulnerability updates.

## 12. UI architecture

- Shared design tokens and components between popup and options.
- Route-level code splitting for options-only migration/settings surfaces.
- Form state remains local until save; canonical state remains in the application service.
- A single typed message protocol connects popup/options and the worker.
- Permission requests originate from visible buttons and return typed outcomes.
- Localization uses Chrome `_locales` for manifest strings and one typed application catalog for UI strings.

## 13. Testing strategy

### Unit

- Rule schema and semantic validation.
- Every compiler action and condition.
- Regex compatibility and substitution boundaries.
- Priority conflict and redirect-cycle detection.
- Legacy parser and migration classifier.
- Import merge/replace planning.

### Integration

- Storage repository with a fake extension API.
- Permission grant/revoke reconciliation.
- DNR remove/add compensation behavior.
- Service-worker initialization idempotency.

### E2E

- Install clean build with no host grant.
- Create and prove block, fixed redirect, regex redirect, and header modification.
- Deny and later grant permission.
- Revoke permission outside the extension and observe degraded state.
- Terminate/restart the worker and prove rule continuity.
- Import, migrate, and roll back fixture data.
- Verify popup, options, keyboard, theme, and language surfaces.

The repository runs a Playwright Chromium extension suite in the default quality gate. It launches the
production `dist/chrome-mv3` build in an isolated persistent profile and currently proves clean-install
permissions, warning/error-free options startup, options/settings navigation, real DNR blocking,
popup-driven pause/resume synchronization,
DNR continuity after forced service-worker termination and event-driven restart, a real host-permission-free
HTTP-to-HTTPS upgrade against an isolated TLS fixture, keyboard switching and persistence for all six locales,
and compact-layout overflow protection. It also covers the complete legacy `localStorage`
review/export/disabled-apply/rollback path, including unsupported and removed raw source data, plus checksummed
rule backup export, disabled merge, replace-time snapshot capture, and exact recovery from the production UI.
This automated Chromium gate is pre-certification evidence; branded Chrome, Edge, and Firefox remain separate
installed-browser release rows because their extension distribution and permission surfaces differ.

## 14. CI and release

Required CI jobs:

1. Lockfile-enforced install.
2. Format, lint, and strict typecheck.
3. Unit and integration tests with coverage thresholds focused on domain/application code.
4. Automated Playwright Chromium extension E2E plus the installed-browser certification matrix.
5. Production build.
6. Generated manifest permission diff.
7. Artifact content and remote-endpoint scan.
8. Reproducible ZIP and checksum.

Release is blocked by unused permissions, unexpected manifest changes, failed migration fixtures, or any unreviewed network endpoint.

## 15. Implementation spikes before committing

- Prove WXT's current stable release against Node 24, Chrome MV3, popup, options, and service worker.
- Extend the proven Playwright harness to the remaining DNR and permission scenarios.
- Prove automatic access to legacy `localStorage` for a same-ID MV3 update and decide whether `offscreen` is necessary.
- Prove optional-origin grant behavior for redirect and request-header DNR actions.
- Build a small compatibility corpus for the old Custom URL grammar before finalizing the V1 rule schema.
