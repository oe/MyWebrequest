# Browser Support Plan

Status: Current-browser runtime certification complete; older-release and store certification pending
Last updated: 2026-09-01

## Current matrix

| Target         | Manifest | Build output       | Current evidence                                                  | Release status            |
| -------------- | -------- | ------------------ | ----------------------------------------------------------------- | ------------------------- |
| Chrome         | MV3      | `dist/chrome-mv3`  | Chrome 151 installed-extension DNR, permission, popup, lifecycle  | Current runtime certified |
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

## Remaining compatibility work

- Repeat the installed-extension matrix on the supported older browser releases.
- Complete permission refusal/revocation and redirect coverage on Edge and Firefox.
- Verify HTTPS upgrade, regex substitution, cross-origin subresource redirect, and cross-origin
  request-header modification independently on each browser.
- Certify the implemented initiator-origin permission model for cross-origin subresource redirects and
  header changes; navigation-only rules request only the request URL origin.
- Add capability checks around regex support, match testing, rule quotas, and any API whose browser support
  differs.
- Run Chrome Web Store, Edge Add-ons, and AMO packaging validators in CI before enabling a release job.
- Decide whether Safari's conversion, Xcode signing, DNR behavior, and store maintenance cost justify a
  fourth target after the three-browser evidence is stable.

The default repository gate also runs isolated Playwright Chromium extension E2E for clean-install
permissions, UI navigation, live block DNR, popup/options synchronization, pause/resume, and forced worker
restart. It also covers representative legacy `localStorage` detection, report export, disabled application,
and complete rollback without dropping unsupported raw data. Chromium automation is a regression gate, not
evidence that a branded Chrome, Edge, or Firefox row has passed its store or installed-browser certification.

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
