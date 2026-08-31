# Browser Support Plan

Status: Multi-target build baseline implemented; per-browser runtime certification pending  
Last updated: 2026-08-31

## Current matrix

| Target         | Manifest | Build output          | Current evidence                                       | Release status |
| -------------- | -------- | --------------------- | ------------------------------------------------------ | -------------- |
| Chrome         | MV3      | `.output/chrome-mv3`  | Build, shared unit tests, browser-rendered UI QA       | Not certified  |
| Microsoft Edge | MV3      | `.output/edge-mv3`    | Build parity with the Chromium target                  | Not certified  |
| Firefox        | MV3      | `.output/firefox-mv3` | Build plus strict `web-ext` report allowlist           | Not certified  |
| Safari         | TBD      | None                  | WXT feasibility only; no Xcode conversion or API spike | Deferred       |

`Not certified` means the artifact exists but has not yet passed installed-extension E2E on that browser.
It must not be presented as store-ready.

## Decisions

- Keep one domain model and DNR compiler. Browser-specific behavior belongs in infrastructure adapters or
  the browser-aware manifest function, never in React components.
- Force Firefox to Manifest V3 (`-b firefox --mv3`) so all current targets share the DNR architecture.
  WXT otherwise defaults Firefox builds to Manifest V2.
- Keep installation host access empty and request narrow origins at runtime with
  `optional_host_permissions`.
- Include Firefox `browser_specific_settings.gecko.id` for signing and declare
  `data_collection_permissions.required: ["none"]` because the product sends no user data off-device.
- Fail Firefox validation on errors or new warnings. The two expected warnings are pinned to React's
  internal `dangerouslySetInnerHTML` implementation; this project does not call that API.
- Treat backdrop blur as enhancement only. The UI has solid fallbacks and does not depend on WebKit-only
  visual behavior.

## Known compatibility work

- Add installed-extension E2E for permission grant, refusal, revocation, and service-worker/background
  restart on Chrome, Edge, and Firefox.
- Verify DNR block, upgrade, redirect, regex substitution, and request-header modification independently
  on each browser.
- Model initiator-origin permissions for cross-origin subresource redirects and header changes. DNR may
  require access to both the request URL and its initiator, while top-level navigation rules differ.
- Add capability checks around regex support, match testing, rule quotas, and any API whose browser support
  differs.
- Run Chrome Web Store, Edge Add-ons, and AMO packaging validators in CI before enabling a release job.
- Decide whether Safari's conversion, Xcode signing, DNR behavior, and store maintenance cost justify a
  fourth target after the three-browser evidence is stable.

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
