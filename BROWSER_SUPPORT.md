# Browser Support Plan

Status: Current-browser runtime certification complete; older-release and store certification pending
Last updated: 2026-09-02

## Current matrix

| Target         | Manifest | Build output       | Current evidence                                                  | Release status            |
| -------------- | -------- | ------------------ | ----------------------------------------------------------------- | ------------------------- |
| Chrome         | MV3      | `dist/chrome-mv3`  | Chrome 152 installed-extension DNR, permission, popup, lifecycle  | Current runtime certified |
| Microsoft Edge | MV3      | `dist/edge-mv3`    | Edge 152 installed-extension DNR, permission, popup, lifecycle    | Current runtime certified |
| Firefox        | MV3      | `dist/firefox-mv3` | Firefox 154 installed-extension DNR, permission, popup, lifecycle | Current runtime certified |
| Safari         | TBD      | None               | WXT feasibility only; no Xcode conversion or API spike            | Deferred                  |

`Current runtime certified` means the unpacked artifact passed the recorded local installed-extension
checks on the listed browser version. It does not mean store-ready: the older-release matrix, remaining
DNR scenarios, signed-artifact upgrade test, and store validation are still required.

## Decisions

- Keep one domain model and DNR compiler. Browser-specific behavior belongs in infrastructure adapters or
  the browser-aware manifest function, never in React components.
- Force Firefox to Manifest V3 (`-b firefox --mv3`) so all current targets share the DNR architecture.
  WXT otherwise defaults Firefox builds to Manifest V2.
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
- Chrome, Edge, and Firefox were reloaded again after the product-name and migration-navigation update.
  Each installed extension exposed `My Webrequest`, omitted migration from primary navigation when no legacy
  source existed, retained migration under Settings, and preserved the existing active-rule state.
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
  the language, Settings, rule, or form controls. The Settings-only legacy-migration entry remained reachable
  and correctly reported that no legacy source was detected. Zoom was reset to 100% after each proof.
- Chrome 152.0.7977.65 imported the representative legacy JSON through the installed extension. The preview
  classified all 20 source items as 2 automatic, 3 review-required, 4 unsupported, and 11 removed-feature
  items, retained the unknown raw key in the exported report, and did not alter active rules before apply.
  Applying the two automatic candidates added them disabled without requesting permission or disturbing the
  three-rule baseline. The one-click pre-migration rollback then removed those candidates and restored the
  exact original three rules and active statuses. Once no pending migration remained, the migration entry was
  again absent from primary navigation and remained available under Settings.

## Remaining compatibility work

- Repeat the installed-extension matrix on the supported older browser releases.
- Verify regex substitution, cross-origin subresource redirect, and cross-origin request-header
  modification independently on each browser.
- Certify the implemented initiator-origin permission model for cross-origin subresource redirects and
  header changes; navigation-only rules request only the request URL origin.
- Add capability checks around regex support, match testing, rule quotas, and any API whose browser support
  differs.
- Run Chrome Web Store, Edge Add-ons, and AMO packaging validators in CI before enabling a release job.
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
gate. A test-only manifest with only the local request and initiator fixture origins additionally proves real
cross-origin wildcard capture redirects and request-header modification. Because that harness bypasses the
native optional-permission prompt, it is not evidence that a branded Chrome, Edge, or Firefox row has passed
its installed-browser or store certification.

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
- [MDN: optional_host_permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/optional_host_permissions)
- [MDN: browser_specific_settings](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)
