# Browser Support Plan

Status: Current-browser and Firefox 142 certification complete; Chrome/Edge 121 and store portals pending
Last updated: 2026-09-02

## Current matrix

| Target         | Manifest | Minimum | Build output       | Current evidence                                                  | Release status            |
| -------------- | -------- | ------- | ------------------ | ----------------------------------------------------------------- | ------------------------- |
| Chrome         | MV3      | 121     | `dist/chrome-mv3`  | Chrome 152 installed-extension DNR, permission, popup, lifecycle  | Current runtime certified |
| Microsoft Edge | MV3      | 121     | `dist/edge-mv3`    | Edge 152 installed-extension DNR, permission, popup, lifecycle    | Current runtime certified |
| Firefox        | MV3      | 142     | `dist/firefox-mv3` | Firefox 154 installed-extension DNR, permission, popup, lifecycle | Current runtime certified |
| Safari         | TBD      | TBD     | None               | WXT feasibility only; no Xcode conversion or API spike            | Deferred                  |

`Current runtime certified` means the unpacked artifact passed the recorded local installed-extension
checks on the listed browser version. It does not mean store-ready: the older-release matrix, remaining
DNR scenarios, signed-artifact upgrade test, and store validation are still required.

## Decisions

- Keep one domain model and DNR compiler. Browser-specific behavior belongs in infrastructure adapters or
  the browser-aware manifest function, never in React components.
- Offer legacy detection, JSON import, review, apply, and rollback only in the Chrome artifact. The legacy
  extension had no Edge or Firefox release, so those targets do not scan for old data and omit migration
  from both primary navigation and Settings.
- Force Firefox to Manifest V3 (`-b firefox --mv3`) so all current targets share the DNR architecture.
  WXT otherwise defaults Firefox builds to Manifest V2.
- Declare Chrome/Edge 121 and Firefox 142 as explicit installation floors. Chromium 121 provides the current
  safe/unsafe dynamic-rule quota model. Firefox 142 excludes the documented Firefox 132-and-earlier defect
  where persisted dynamic rules could stop applying after restart and is the first Firefox-for-Android
  release whose schema accepts AMO's required `data_collection_permissions` declaration (desktop support
  arrived in Firefox 140).
- Keep installation host access empty and request narrow origins at runtime with
  `optional_host_permissions`.
- Use `declarativeNetRequest` so safe block and HTTPS-upgrade rules need no host access. Redirect and
  request-header rules request the matched origin, plus explicit initiator origins for subresources.
- Include Firefox `browser_specific_settings.gecko.id` for signing and declare
  `data_collection_permissions.required: ["none"]` because the product sends no user data off-device.
- Fail Firefox validation on errors or new warnings. The two expected warnings are pinned to React's
  internal `dangerouslySetInnerHTML` implementation; this project does not call that API.
- Treat backdrop blur as enhancement only. The UI has solid fallbacks and does not depend on WebKit-only
  visual behavior.
- Keep a portable internal ceiling of 4,500 enabled dynamic rules, below Firefox's 5,000-rule ceiling and
  Chromium's 5,000 unsafe-rule ceiling. Keep a separate 900-rule ceiling for wildcard/regex-backed rules,
  below the browsers' 1,000 regex-rule quota. The runtime asks each browser's `isRegexSupported()` API before
  enabling a pattern and sets `requireCapturing` when a redirect uses capture references. The editor's local
  match preview is advisory; the browser engine remains authoritative.

## 2026-09-01 installed-extension evidence

- Chrome 151.0.7922.174: no-host-access install; block, redirect, and request-header rules; permission
  refusal, grant, revocation, and re-grant; pause/resume; popup/options synchronization; service-worker
  reload recovery. Header fixture received `X-E2E-Test: chrome-pass`.
- Microsoft Edge 152.0.0.0: no-host-access install; all-resource block including top-level navigation;
  request-header permission and live modification; pause/resume; popup/options synchronization; extension
  reload recovery. Header fixture received `X-E2E-Test: edge-pass`.
- Firefox 154.0.1: temporary install from `dist/firefox-mv3`; all-resource block including top-level
  navigation; request-header permission requested from the originating click; pause/resume; popup/options
  synchronization; background reload recovery. Header fixture received `X-E2E-Test: firefox-pass`.
- Chrome, Edge, and Firefox were reloaded again after the product-name and initial migration-navigation
  update. Each installed extension exposed `My Webrequest` and preserved the existing active-rule state.
- The current Firefox 154 schema was checked locally after a runtime rejection showed that `webbundle`
  was not accepted. Firefox's all-resource expansion is therefore limited to the values accepted by that
  installed schema and excludes `webbundle` and `webtransport`.

## 2026-09-02 installed-extension evidence

- Chrome 152.0.7977.65, Microsoft Edge 152.0.4191.53, and Firefox 154.0.1 each kept the control request
  `http://example.com/` on HTTP and reported it as not secure before the test rule was enabled.
- The same enabled `http://example.com/*` HTTPS-upgrade rule then converted a fresh HTTP navigation to a
  secure HTTPS page in all three installed browsers without requesting host access. The temporary rule was
  disabled after each proof, leaving the pre-existing browser test rules unchanged.
- Microsoft Edge 152.0.4191.53 and Firefox 154.0.1 each showed only `http://example.com/*` in the product
  explanation and native permission prompt for a document redirect rule. Denial kept the enabled intent but
  reported `Permission` and installed no effective redirect; allowing access changed the rule to `Active`
  and redirected a fresh `http://example.com/` navigation to IANA's HTTPS example-domain page.
- Revoking `http://example.com` from each browser's extension settings immediately changed the affected
  redirect rule to `Permission`; a fresh HTTP navigation then stayed on Example Domain. Re-granting from the
  originating rule switch restored `Active`. Firefox's targeted revocation left its separately granted
  `127.0.0.1` header rule active. Edge's global site-access revocation also downgraded that header rule until
  its separate origin was re-granted, while its hostless block rule remained active throughout. The temporary
  redirect rules were left saved but disabled after verification.
- The installed options UI in Chrome 152.0.7977.65, Edge 152.0.4191.53, and Firefox 154.0.1 was switched by
  keyboard through English, Simplified Chinese, Korean, Japanese, French, and Spanish. Each localized shell
  rendered its translated navigation and rule controls, and English persisted after a browser-page reload.
  At exactly 200% browser zoom, each target changed to the compact navigation/detail layout without losing
  the language, Settings, rule, or form controls. At this checkpoint the Settings-only legacy-migration entry
  was still present in every build; the later Chrome-only product decision supersedes that behavior. Zoom was
  reset to 100% after each proof.
- Chrome 152.0.7977.65 imported the representative legacy JSON through the installed extension. The preview
  classified all 20 source items as 2 automatic, 3 review-required, 4 unsupported, and 11 removed-feature
  items, retained the unknown raw key in the exported report, and did not alter active rules before apply.
  Applying the two automatic candidates added them disabled without requesting permission or disturbing the
  three-rule baseline. The one-click pre-migration rollback then removed those candidates and restored the
  exact original three rules and active statuses. Once no pending migration remained, the migration entry was
  again absent from primary navigation and remained available under Settings.
- After the Chrome-only migration scope was applied, the rebuilt unpacked artifacts were reloaded in all
  three browsers. Chrome retained `Backup & restore` and `Legacy migration` in Settings. Edge 152.0.4191.53
  and Firefox 154.0.1 each exposed only `Backup & restore`; neither showed migration in primary navigation or
  Settings, while their existing four-rule state remained intact.
- Chrome 152.0.7977.65, Edge 152.0.4191.53, and Firefox 154.0.1 each exported their installed rule state as a
  checksummed JSON backup. Independent SHA-256 envelope verification passed for all three files. Importing the
  same file in merge mode skipped every equivalent rule without changing rule count or active status. Replace
  mode kept the same rule identities but disabled every imported rule and created a visible pre-replace
  snapshot. One-click recovery restored the exact original counts and active-state baselines: Chrome returned
  to three rules with two active, and Edge and Firefox each returned to four rules with two active. No recovery
  banner remained afterward.
- Chrome 152.0.7977.65 exposed a real permission-request defect during the installed cross-origin test: the
  initial `*://*.localhost/*` initiator pattern was rejected because the manifest declares scheme-specific
  optional host permissions. Runtime permission normalization now expands wildcard schemes into bounded HTTP
  and HTTPS patterns, including legacy rules already stored with `*://`. The rebuilt Chrome, Edge 152.0.4191.53,
  and Firefox 154.0.1 artifacts each explained and requested exactly `http://*.localhost/*`,
  `http://127.0.0.1/*`, and `https://*.localhost/*`. Their native prompts described localhost access, both
  fixture rules became active after the grant, a cross-origin XHR redirect preserved the wildcard capture as
  `/target/captured-value`, and the independent header request arrived with
  `X-MWR-Cross-Origin: cross-origin-pass`.
- Firefox 142.0 accepted the exact release ZIP as temporary add-on `mywebrequest@evecalm.com` in a clean,
  isolated GeckoDriver profile. The production adapter blocked a real local navigation without host access,
  upgraded a real HTTP navigation to the local HTTPS fixture while host origins remained empty, installed
  exactly 900 of 902 regex-backed rules and 4,500 of 4,502 total rules in stored order, then kept all 4,500
  rules after `browser.runtime.reload()`. Its real optional-host prompt was denied, granted, revoked, and
  granted again; DNR rules followed each permission transition without disabling stored rules. With the
  bounded fixture origins granted, a cross-origin wildcard redirect preserved `$1` and a request-header rule
  modified the outgoing request. The same exact package rendered all six locales, preserved keyboard focus,
  honored reduced motion, reflowed without horizontal overflow at 200% zoom, exported and safely re-imported
  a checksummed backup, and synchronized pause/resume state between the popup, options page, storage, and DNR.
- The Chromium 121 floor runner is wired into CI with the official Chrome for Testing binary and the exact
  Chrome release archive. Local execution on this Apple Silicon host is not usable as certification: the old
  arm64 macOS binary is incompatible with the current macOS release, while x86 Linux emulation crashes in
  Chrome's GPU process. A native x86 CI pass is still required before the Chromium floor is certified.
- Microsoft's official Linux package repository still serves Edge Stable `121.0.2277.128-1`. CI now pins its
  repository SHA-256, extracts it without installation, loads the exact Edge release archive, and runs the
  shared nine-scenario Chromium matrix; the two Chrome-only migration scenarios are explicitly skipped. Edge
  152.0.4191.53 passed that target-aware exact-archive runner locally. Edge 121 remains uncertified until the
  native x86 CI job reports success.
- An isolated Chromium profile installed exactly the first 900 of 902 valid regex-backed rules and exactly the
  first 4,500 of 4,502 valid dynamic rules. This exercises the production browser adapter and confirms both
  deterministic internal ceilings without touching any normal browser profile.
- A same-extension-ID upgrade harness wrote all representative V0.8 `localStorage` keys with a legacy fixture,
  restarted the browser against the production artifact at the same unpacked path, and retained the same
  extension origin. The new options page detected all source data and staged the expected 20-item migration
  report, including the unknown raw key. This proves the unpacked upgrade path, but does not replace a signed
  store-artifact upgrade test.
- Store metadata preflight now fails the repository gate if the product identity, six localized manifest
  messages, description bounds, permission disclosures, or local-only privacy statements drift apart. AMO's
  package validator remains automated; Chrome Web Store and Edge Add-ons acceptance still require submission.
- Three 1280x800 screenshots were captured separately from each exact checksummed Chrome, Edge, and Firefox
  release archive. They show the rule manager, the bounded website-access explanation, and a checksum-verified
  safe import preview. The provenance manifest records the archive/browser/image hashes, and the release gate
  now rejects screenshots that no longer match `dist/SHA256SUMS`. Chrome used isolated Chromium 151, Edge used
  Edge 152.0.4191.53, and Firefox used the declared-floor Firefox 142.0.

## Remaining compatibility work

- Obtain successful native x86 CI runs for the pinned Chrome 121 and Edge 121 matrices; Firefox 142 is already
  automated and locally certified.
- Run a signed upgrade from the previous public Chrome artifact with the production store ID.
- Submit the checksummed artifacts and audited screenshots to Chrome Web Store, Edge Add-ons, and AMO portal
  validation; AMO package lint, cross-store metadata preflight, and screenshot provenance are automated.
- Decide whether Safari's conversion, Xcode signing, DNR behavior, and store maintenance cost justify a
  fourth target after the three-browser evidence is stable.

The default repository gate also runs isolated Playwright Chromium extension E2E for clean-install
permissions, UI navigation, live block DNR, popup/options synchronization, pause/resume, and forced worker
restart. A local TLS fixture proves real HTTP-to-HTTPS upgrade without host access. The suite keyboard-switches
all six locales, verifies persistence and compact-layout overflow, disables glass effects under forced colors,
honors reduced motion, restores keyboard focus, and proves bounded permission previews can be cancelled without
granting origins or changing runtime state. It also covers representative legacy `localStorage`
detection/report export/disabled application/complete rollback and verifies checksummed backup export, safe
disabled merge, replace-time snapshot creation, and one-click recovery. Chromium automation is a regression
gate. It also exercises both production quota ceilings and a same-path, same-ID upgrade from a legacy-storage
fixture. A test-only manifest with only the local request and initiator fixture origins additionally proves real
cross-origin wildcard capture redirects and request-header modification. Because that harness bypasses the
native optional-permission prompt, it is not evidence that a branded Chrome, Edge, or Firefox row has passed
its installed-browser or store certification. For manual installed-browser rechecks, run
`pnpm fixture:cross-origin` and import `tests/fixtures/cross-origin-permission-rules.json` as a temporary
replace-state fixture, then restore the automatically captured snapshot when the test is complete.

## Release gate

A browser becomes supported only after all of the following pass on its current stable release and one
supported older release:

1. Install/update with no required host access.
2. Popup, options, storage, permissions, and background lifecycle E2E.
3. Every supported DNR action with same-origin and cross-origin fixtures.
4. Permission revocation and recovery without stale active rules.
5. Browser store validation, privacy disclosure, artifact inspection, and upgrade test.

## Primary references

- [WXT: Targeting different browsers](https://wxt.dev/guide/essentials/target-different-browsers)
- [WXT: Browser-aware manifest configuration](https://wxt.dev/guide/essentials/config/manifest)
- [MDN: declarativeNetRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest)
- [Chrome: declarativeNetRequest quotas and regex support](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [Chrome: minimum_chrome_version](https://developer.chrome.com/docs/extensions/reference/manifest/minimum-chrome-version)
- [MDN: declarativeNetRequest.isRegexSupported](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/isRegexSupported)
- [MDN: browser_specific_settings](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)
- [MDN: optional_host_permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/optional_host_permissions)
- [Mozilla: GeckoDriver supported platforms](https://firefox-source-docs.mozilla.org/testing/geckodriver/Support.html)
- [Mozilla: GeckoDriver system-access flag](https://firefox-source-docs.mozilla.org/testing/geckodriver/Flags.html)
- [Microsoft: official Edge Linux package archive](https://packages.microsoft.com/repos/edge/pool/main/m/microsoft-edge-stable/)
