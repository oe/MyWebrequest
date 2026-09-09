# Browser Support Plan

Status: Maintained browser policy; historical results do not certify the current candidate.
Last updated: 2026-09-09

## Build targets and historical evidence

| Target         | Manifest | Minimum | Build output   | Current evidence                                                  | Release status              |
| -------------- | -------- | ------- | -------------- | ----------------------------------------------------------------- | --------------------------- |
| Chrome         | MV3      | 121     | `dist/chrome`  | Chrome 152 installed-extension DNR, permission, popup, lifecycle  | Historical runtime evidence |
| Microsoft Edge | MV3      | 121     | `dist/edge`    | Edge 152 installed-extension DNR, permission, popup, lifecycle    | Historical runtime evidence |
| Firefox        | MV3      | 142     | `dist/firefox` | Firefox 154 installed-extension DNR, permission, popup, lifecycle | Historical runtime evidence |
| Safari         | TBD      | TBD     | None           | WXT feasibility only; no Xcode conversion or API spike            | Deferred                    |

The detailed tables below retain historical evidence. On 2026-09-06 the current local candidate was
additionally exercised in Chromium 151, Edge 152 and Firefox 155. Source captures from each current archive
are recorded in `store-assets/screenshots/manifest.json`. The redirect builder now has a fixed action footer
and an opaque dialog background; its desktop and compact layout and real host-transform boundaries have
explicit regression coverage. Current local verification does not certify the minimum-version matrix,
a store-signed update, or portal acceptance. See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for outstanding gates.

## Decisions

- Keep one domain model and DNR compiler. Browser-specific behavior belongs in infrastructure adapters or
  the browser-aware manifest function, never in React components.
- Offer legacy detection, JSON import, review, apply, and rollback only in the Chrome artifact. The legacy
  extension had no Edge or Firefox release, so those targets do not scan for old data and omit migration
  from both primary navigation and Settings.
- Preserve the signed legacy Chrome identity in the Chrome manifest only. The recorded public key derives
  `jaghnfjaikbcdliekgchjeeklkeceell`; Edge and Firefox artifacts are audited to reject that key.
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

## Historical evidence

See [BROWSER_EVIDENCE.md](../archive/BROWSER_EVIDENCE.md) for dated installed-browser observations, and [the release checklist](RELEASE_CHECKLIST.md) for candidate sign-off.

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
