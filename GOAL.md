# RequestOrbit V1 Goal

Status: Active delivery goal  
Last updated: 2026-09-03
Related documents: [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[MIGRATION.md](MIGRATION.md), [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md),
[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)

## Outcome

Ship a trustworthy, local-first Manifest V3 request-rule manager for Chrome, Edge, and Firefox. A user
must be able to create, understand, test, authorize, enable, recover, import, export, and migrate rules
without editing DNR JSON or granting broad installation-time host access.

The release keeps the selected shadcn `radix-nova` visual language and restrained Apple-like material,
but correctness, explainability, accessibility, and upgrade safety are release gates rather than polish.

## Non-negotiable requirements

1. **Runtime correctness:** stored rules, granted origins, compiled DNR rules, and displayed status converge
   after edits, permission changes, browser startup, and service-worker restart.
2. **Six languages:** English, Simplified Chinese, Korean, Japanese, French, and Spanish cover every
   user-facing application and manifest string.
3. **Legacy preservation:** every known legacy item is converted, held for review, or retained in an
   exportable report. Nothing is silently dropped, broadened, enabled, or semantically changed.
4. **One current rule model:** legacy formats are accepted at migration/import boundaries and converted
   into the versioned model. The runtime does not permanently maintain two rule engines.
5. **Least privilege:** installation requests no host access; new origins are requested only from a direct
   user action with a plain-language explanation.
6. **Local only:** no accounts, telemetry, remote code, remote fonts, or product-owned network endpoint.
7. **Evidence before support claims:** a browser is supported only after installed-extension E2E and its
   store validator pass.
8. **Learnable without guesswork:** first-run examples and a fast, localized help site explain matching,
   actions, permissions, migration, and recovery without hiding unsafe defaults.

## Language contract

| Language           | Locale  | Release requirement                        |
| ------------------ | ------- | ------------------------------------------ |
| English            | `en`    | Source locale and fallback                 |
| Simplified Chinese | `zh_CN` | Complete application and manifest coverage |
| Korean             | `ko`    | Complete application and manifest coverage |
| Japanese           | `ja`    | Complete application and manifest coverage |
| French             | `fr`    | Complete application and manifest coverage |
| Spanish            | `es`    | Complete application and manifest coverage |

The browser locale is the default. A persisted in-product language selector may override it. Application
strings use one typed catalog; `_locales` remains the source for manifest strings. Missing non-English
keys fail CI instead of falling back silently in production. Dates, counts, and plurals use `Intl`.

## Legacy compatibility contract

The pre-cleanup implementation is preserved in Git at commit `e100dbf`, while commit `9527c62` contains the
signature-valid version 0.12.11 CRX and its source schema. That generation stores object-shaped rule arrays
in `chrome.storage.sync`; older generations used JSON-encoded page `localStorage`. Known keys span `block`,
`hsts`, `hotlink`, `log`, `custom`, `cors`, `contextmenu`, `ua`, `ua-list`, `gsearch`, `gstatic`, `onoff`,
`config`, and `version`.

Automatic migration is the preferred path for a same-extension-ID Chrome update. It reads sync and page
storage without mutating either, deterministically merges non-overlapping rule collections, preserves
conflicts for export, stages a report, and applies nothing until validation is complete. Versioned JSON
import uses the same parser when automatic access is unavailable.

| Legacy input          | V1 treatment                | Default outcome                                        |
| --------------------- | --------------------------- | ------------------------------------------------------ |
| `block` URL array     | Modern block rule           | Automatic when valid                                   |
| `hsts` URL array      | Advanced HTTPS-upgrade rule | Automatic when scope is equivalent                     |
| `hotlink` URL array   | Preserved legacy record     | Unsupported until bounded initiator domains are chosen |
| `custom` route object | Fixed or regex redirect     | Automatic, review-required, or unsupported per grammar |
| `gsearch` rules       | Ordinary redirect candidate | Review-required; disabled until equivalence is proven  |
| `gstatic` rules       | Preserved legacy record     | Removed feature; obsolete destination is never enabled |
| `log` rules           | Preserved legacy record     | Removed feature; request logging is not restored       |
| CORS/context-menu/UA  | Preserved legacy record     | Removed feature; source remains exportable             |
| `onoff`               | Per-rule enabled intent     | Preserved only after conversion and permission review  |
| `config`              | Relevant preference mapping | Unsupported preferences retained in the snapshot       |
| Unknown keys          | Raw migration snapshot      | Retained, never activated                              |

Legacy Custom URL compatibility includes named host/path parameters, terminal splats, query-parameter
holders, reserved values (`p`, `h`, `m`, `r`, `q`, `u`), encoding behavior, repeated query keys, and the
stored compiled fields used by historical exports. Conversions that cannot preserve order-independent
query extraction or encoding semantics remain disabled and exportable.

## Delivery milestones

### M1 — Runtime confidence

- Reconcile storage and installed DNR rules on install, startup, storage change, and permission change.
- Prove grant, refusal, revocation, re-grant, and worker restart behavior.
- Add typed infrastructure adapters and compensation tests for partial failures.
- Remove or disable navigation that has no implemented destination.

Exit gate: Chrome can prove every currently shipped action against real requests with no stale UI state.

### M2 — Legacy preservation

- Capture representative fixtures from every legacy key and export shape.
- Implement bounded parsing, source fingerprinting, classification, and deterministic reporting.
- Implement the Custom URL compatibility compiler and behavior-focused fixture tests.
- Add review, export, apply, idempotency, and rollback flows.

Exit gate: every source item appears exactly once in a repeatable report; no unsupported item becomes active.

### M3 — Complete rule management

- Finish duplicate, deletion undo, unsaved-change protection, keyboard navigation, and actionable statuses.
- Complete basic/advanced conditions and all supported request actions.
- Add versioned JSON export and previewed merge/replace import with an automatic pre-replace snapshot.
- Expose quota, regex capability, permission, conflict, and redirect-cycle results.

Exit gate: all V1 workflows in `PRODUCT_SPEC.md` are usable without dead controls or hidden failure states.

### M4 — Localization and accessibility

- Externalize all UI strings into the typed six-language catalog.
- Complete localized manifests, language selection, pluralization, and translation coverage tests.
- Verify keyboard-only use, focus restoration, announcements, 200% zoom, high contrast, reduced motion,
  and WCAG 2.2 AA contrast.

Exit gate: all six languages pass the same functional and accessibility smoke suite without clipping.

### M5 — Onboarding and help

- Offer three editable starter rules plus a blank-rule path from one unified empty state.
- Create every starter disabled and require the same validation and permission flow as an ordinary rule.
- Link Settings and the empty state to a six-language help center.
- Build the static product and documentation site with Astro 7, canonical URLs, language alternates,
  structured data, sitemap, responsive layouts, and no unsupported installation claim.
- Document executable advanced Redirect recipes and publish a legacy breaking-change matrix with practical
  alternatives for every intentionally removed capability.
- Keep the public site task-first: four help entry points, one navigation surface per guide, progressive
  disclosure for reference-heavy material, and concise semantic homepage copy instead of SEO filler.
- Publish the site through the official GitHub Pages Actions workflow.

Exit gate: all 48 localized guide routes build, the empty-state journey passes installed-extension E2E,
and the production site is reachable at its canonical project URL.

### M6 — Browser certification and release

- Run installed-extension E2E on Chrome, Edge, and Firefox for every action and permission lifecycle.
- Prove worker termination/restart, migration, import rollback, and cross-surface synchronization.
- Audit manifests, permissions, endpoints, source maps, bundled assets, ZIP contents, and checksums.
- Pass Chrome Web Store, Edge Add-ons, and AMO validation and align privacy/store statements with behavior.

Exit gate: every published target passes its release matrix; unsupported targets are not advertised.

## V1 exclusions

- Request logging and request-body capture.
- QR-code generation.
- Obsolete Google/useso CDN rewriting.
- Response-header/CORS presets.
- Cross-device sync, accounts, telemetry, side panel, Safari packaging, and enterprise sharing.

Removed features may remain visible only as preserved migration records with an explanation and export
path. They never return as active runtime code.

## Definition of done

V1 is complete only when all milestone exit gates pass, the repository quality gate is green on Node 24,
the worktree contains no obsolete implementation, generated artifacts are reproducible under `dist/`, and
the support matrix contains no claim that exceeds installed-extension evidence. Store submission remains a
separate user-authorized operation and is not implied by completing the website or release candidates.
