# Release Checklist

Status: Node 24 package gate and current-browser runtime pass recorded; older-release, full matrix, and
store certification pending
Last updated: 2026-09-02

Never mark a browser supported from build output alone. Record the browser version, artifact checksum,
test date, and evidence for every completed row.

## 1. Create candidate artifacts

Use Node.js 24 and pnpm 11 from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm release:package
```

This runs the complete repository gate, creates Chrome, Edge, Firefox, and Firefox source archives in
`dist/`, rejects stale or unexpected ZIP files, re-audits the final package directories, writes
`dist/SHA256SUMS`, and rebuilds all four archives to prove byte-for-byte reproducibility. Do not modify an
archive after recording its checksum.

CI runs the same command on Node.js 24 and uploads the four archives plus `SHA256SUMS` as one immutable
workflow artifact. Use that artifact for installed-browser testing and store submissions so the tested
package and submitted package are identical.

## Pre-certification evidence

These checks reduce risk but do not satisfy any installed-browser matrix row:

- 2026-09-01: the production options UI switched among all six release languages, retained the selected
  language after reload, supported arrow-key rule navigation, and produced no console warning or error in
  the local browser-rendered smoke test.
- 2026-09-01: Firefox 154.0.1 accepted `dist/firefox-mv3` as the temporary add-on
  `mywebrequest@evecalm.com` in a clean headless profile.
- 2026-09-01: the complete `pnpm release:package` gate passed on Homebrew Node 24.20.0 with 23 test files
  and 111 tests. Chrome, Edge, Firefox, and Firefox-source archives passed artifact audits, AMO lint, and
  SHA-256 verification. The resulting archive hashes were identical to the preceding package run.
- 2026-09-01: Playwright Chromium extension E2E became part of `pnpm check` and CI. Its isolated production-
  build profile proves zero required host origins, warning/error-free options startup, the options/settings
  migration-navigation contract, real DNR blocking against a local fixture, a real HTTP-to-HTTPS upgrade
  against an isolated TLS fixture with no host grant, popup pause/resume synchronization, and DNR continuity
  after forced service-worker termination and event-driven restart. It keyboard-switches all six locales,
  verifies persistence and compact-layout overflow, forced-color and reduced-motion fallbacks, and keyboard
  focus restoration. Navigation and cross-site subresource rules expose only their bounded required origins;
  cancelling leaves storage, permissions, and DNR untouched. The suite also injects the representative
  old-version `localStorage` fixture, verifies all 20 classified items and the raw unknown-key export, applies
  only the two automatic candidates disabled, and restores the empty pre-migration snapshot without
  notification overlays blocking the recovery action. The migration entry leaves primary navigation after
  the pending work is applied but stays reachable from Settings. It verifies a checksummed production backup download,
  additive merge with imported rules disabled, full replacement with an automatic pre-replace snapshot, and
  exact recovery from that snapshot. It does not replace the branded-browser rows below.
- 2026-09-01: the unpacked artifacts were exercised in Chrome 151.0.7922.174, Edge 152.0.0.0, and
  Firefox 154.0.1. The checks covered top-level blocking, live request-header modification, pause/resume,
  popup/options state, and extension/background reload recovery. Chrome additionally covered redirect and
  permission refusal/revocation/re-grant. This is current-version runtime evidence, not store certification.
- 2026-09-01: after reloading the then-current unpacked artifact in all three installed browsers, the browser
  extension details and options page consistently showed `My Webrequest`. Existing active DNR rules and their
  permission status remained visible after reload. The migration menu behavior from this checkpoint was later
  superseded by the Chrome-only migration decision.
- 2026-09-02: Chrome 152.0.7977.65, Edge 152.0.4191.53, and Firefox 154.0.1 each kept a control request to
  `http://example.com/` on HTTP, then upgraded the same fresh HTTP navigation to a secure HTTPS page after
  enabling the installed extension's `http://example.com/*` HTTPS-upgrade rule. No host access was requested,
  and the temporary rule was disabled after each browser proof.
- 2026-09-02: the isolated Chromium suite added a ninth test that loads the production extension through a
  test-only manifest with only the two local fixture origins granted. It proves a real cross-origin wildcard
  capture redirect, exact `$1` substitution, initiator scoping, and request-header modification. The complete
  nine-test suite passed; the test-only grant deliberately does not satisfy the native permission-prompt rows.
- 2026-09-02: Edge 152.0.4191.53 and Firefox 154.0.1 completed the installed navigation-redirect permission
  lifecycle. Each product explanation and native prompt named only `http://example.com/*`; denial produced a
  `Permission` rule with no redirect, allowing access produced an `Active` rule and a real Example Domain to
  IANA redirect, external revocation immediately removed the redirect, and re-grant restored it. Firefox's
  targeted revocation preserved its independent `127.0.0.1` header rule. Edge's global site-access revocation
  also downgraded that header rule until its origin was re-granted, while its hostless block rule stayed
  active. Both temporary redirect rules were left disabled after the proof.
- 2026-09-02: the installed options UI in Chrome 152.0.7977.65, Edge 152.0.4191.53, and Firefox 154.0.1 was
  keyboard-switched through English, Simplified Chinese, Korean, Japanese, French, and Spanish. Localized
  navigation and rule controls rendered in every language, and the restored English selection survived
  reload. At exactly 200% browser zoom, all three targets exposed the compact navigation/detail layout and
  kept language, Settings, rule, and form controls reachable. At this checkpoint the Settings-only migration
  entry was still present in every target; the later Chrome-only product decision supersedes that behavior.
  Zoom was reset to 100% after verification.
- 2026-09-02: Chrome 152.0.7977.65 imported the representative legacy JSON through the native file chooser.
  Its installed UI classified all 20 items as 2 automatic, 3 review-required, 4 unsupported, and 11 removed-
  feature items; exported the full raw snapshot and unknown key; kept active rules unchanged before apply;
  added only the two automatic candidates disabled; and restored the exact original three-rule baseline with
  the pre-migration rollback. Afterward, migration again disappeared from primary navigation but remained
  available under Settings.
- 2026-09-02: after the installed-browser evidence updates, `pnpm release:package` passed again with 23 test
  files, 111 unit tests, 9 Chromium extension tests, browser artifact audits, AMO lint, and byte-for-byte
  reproducibility for all four release archives.
- 2026-09-02: the migration feature was scoped to Chrome because no legacy Edge or Firefox release existed.
  After rebuilding and reloading the unpacked artifacts, Chrome Settings retained both `Backup & restore`
  and `Legacy migration`; Edge 152.0.4191.53 and Firefox 154.0.1 Settings each exposed only `Backup & restore`.
  Migration was absent from both non-Chrome primary navigation surfaces, and their four-rule states were
  unchanged. The complete release-package gate passed with 24 test files, 113 unit tests, 9 Chromium
  extension tests, browser artifact audits, AMO lint, and byte-for-byte reproducibility for all four archives.
- 2026-09-02: Chrome 152.0.7977.65, Edge 152.0.4191.53, and Firefox 154.0.1 each exported a real installed-state
  backup whose envelope checksum passed an independent SHA-256 verification. Same-file merge was idempotent
  and preserved the original active rules; same-file replacement disabled all imported rules and created the
  pre-replace recovery snapshot. One-click recovery restored Chrome to its exact three-rule/two-active baseline
  and Edge and Firefox to their exact four-rule/two-active baselines, with the recovery marker cleared.
- 2026-09-02: installed Chrome 152.0.7977.65 revealed that requesting the generated
  `*://*.localhost/*` initiator pattern was rejected as outside the manifest's optional permissions. Wildcard
  schemes are now normalized into separate HTTP and HTTPS patterns at request time, including for existing
  stored rules. Rebuilt Chrome, Edge 152.0.4191.53, and Firefox 154.0.1 each showed exactly
  `http://*.localhost/*`, `http://127.0.0.1/*`, and `https://*.localhost/*` before its native localhost-access
  prompt. After allowing access, all three produced `/target/captured-value` through the real cross-origin XHR
  redirect and `header:cross-origin-pass` through the independent request-header fixture.
- 2026-09-02: Firefox 142.0 accepted the final `dist/firefox-mv3` package as a temporary MV3 add-on in a clean
  profile. The repository gate now passes with 24 test files, 114 unit tests, 11 isolated Chromium extension
  tests, store metadata preflight, all browser artifact audits, AMO lint, and byte-for-byte reproducible
  archives. Firefox 142 runtime
  scenarios beyond installation remain unchecked. Chromium 121 is now a native x86 CI gate; local emulation
  on this Apple Silicon host is not counted because the old Chrome binary crashes in its emulated GPU process.
- 2026-09-02: an isolated production Chromium profile proved deterministic enforcement at both safety
  boundaries: 900 of 902 regex-backed rules and 4,500 of 4,502 total dynamic rules were installed in stored
  order. A separate same-path, same-extension-ID browser restart upgraded a V0.8-shaped fixture to the current
  artifact, preserved its page `localStorage`, and staged the exact 20-item legacy report with its unknown raw
  key. This is repeatable unpacked-upgrade evidence, not the still-required signed-store upgrade.
- 2026-09-02: store metadata preflight aligned `My Webrequest`, all six localized manifest descriptions,
  declared permissions, the store description, and the local-only privacy policy. This is a source/package
  quality gate; it is not Chrome Web Store or Edge Add-ons acceptance.

## 2. Installed-browser matrix

Run each scenario on the current stable browser and at the declared installation floor: Chromium 121 for
Chrome/Edge and Firefox 142. A newer browser passing does not certify the floor.

| Scenario                                         | Chrome | Edge | Firefox |
| ------------------------------------------------ | ------ | ---- | ------- |
| Clean install has no required host access        | ✓      | ✓    | ✓       |
| Popup and options open with no console errors    | ✓      | ✓    | ✓       |
| Block rule works without host access             | ✓      | ✓    | ✓       |
| HTTPS-upgrade rule works without host access     | ✓      | ✓    | ✓       |
| Navigation redirect grant, refusal, and re-grant | ✓      | ✓    | ✓       |
| Subresource redirect requests initiator access   | ✓      | ✓    | ✓       |
| Request-header rule requests initiator access    | ✓      | ✓    | ✓       |
| Permission revocation removes affected DNR rules | ✓      | ✓    | ✓       |
| Service-worker/background restart reconciles DNR | ✓      | ✓    | ✓       |
| Popup/options/storage state stays synchronized   | ✓      | ✓    | ✓       |
| Legacy migration review/export/apply/rollback    | ✓      | N/A  | N/A     |
| Backup merge/replace and recovery snapshot       | ✓      | ✓    | ✓       |
| Six locales pass keyboard and 200% zoom smoke    | ✓      | ✓    | ✓       |

For redirects and request-header rules, verify both the matched request origin and explicit initiator
origins appear in the product explanation before the browser prompt. A rule must never be shown as active
when either permission is missing.

Legacy migration is N/A for Edge and Firefox because no legacy version was published for either browser.
Their release artifacts must omit migration from primary navigation and Settings and must not scan legacy
page storage.

## 3. Store validation

| Gate                                                         | Chrome Web Store | Edge Add-ons | AMO |
| ------------------------------------------------------------ | ---------------- | ------------ | --- |
| Package accepted by validator                                | ☐                | ☐            | ☐   |
| Permission disclosure matches the generated manifest         | ☐                | ☐            | ☐   |
| Privacy statement matches runtime and contains no telemetry  | ☐                | ☐            | ☐   |
| Screenshots come from the exact checksummed release artifact | ☐                | ☐            | ☐   |
| Upgrade from the previous public version preserves data      | ☐                | ☐            | ☐   |

## 4. Sign-off record

Record one row per artifact in the release issue or changelog:

| Browser | Version tested | Artifact filename | SHA-256 | Tested at | Evidence link | Result |
| ------- | -------------- | ----------------- | ------- | --------- | ------------- | ------ |
|         |                |                   |         |           |               |        |

Release only browser rows that have passed both sections 2 and 3. Keep failed or untested targets in the
build matrix as experimental and do not advertise them as supported.
