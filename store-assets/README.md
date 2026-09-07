# Store assets

**Current status (2026-09-06): refreshed locally from the current release archives; not submitted.**
The provenance and dimension audit passes. Any later extension changes require fresh captures again.

The 1280x800 originals under `screenshots/<browser>/` cover seven real UI states: rule management,
bounded permission explanation, backup import preview, two-address creation, host scope, additional test
URLs, and simple editing. Each browser is captured from its own checksummed archive in an isolated profile.

The five English Chrome listing images under `listing-screenshots/chrome/en-US/` use the current creation,
host scope, test, edit and backup captures. They preserve the entire source image and product header,
without a fabricated browser bar, rotation or cropping. English is the currently prepared image locale;
localized descriptions are available separately below. Additional localized screenshots remain optional
follow-up work, not evidence already captured.

For Chrome Web Store, use `chromeDescription` as the complete concise description; it already includes
the rename note. The shared `detailedDescription` and separate `chromeLegacyMigrationNote` remain available
for other store formats. The six Chrome descriptions were saved as drafts on 2026-09-07.

`listing/<locale>.json` contains paste-ready store metadata for English, Simplified Chinese, Korean,
Japanese, French, and Spanish. The shared descriptions intentionally contain no browser-specific migration
claim. Only `chromeLegacyMigrationNote` may be appended to the Chrome listing; it must never be copied to
Edge Add-ons or AMO.

The canonical icon lives at `brand/app-icon.svg`. `pnpm generate:brand-assets` renders the runtime
16/32/48/96/128px PNG matrix, Edge's 300px listing logo, Chrome/Edge 440x280 promotional tiles, and Chrome's
optional 1400x560 marquee tile. The promotional artwork preserves the blue globe and complete current UI. The small tiles contain no
marketing text; the optional marquee names RequestOrbit. No artificial browser controls are added.

- Chrome Web Store accepts 1280x800 or 640x400 screenshots and recommends the larger size.
- Chrome Web Store requires a 440x280 small promotional tile and accepts an optional 1400x560 marquee tile.
- Microsoft Edge Add-ons accepts 1280x800 or 640x480 screenshots.
- Firefox Add-ons recommends 1280x800 and a 1.6:1 ratio for other sizes.

The browser-specific source archive, archive checksum, browser version, image dimensions, and image checksum
are recorded in `screenshots/manifest.json`. Brand and promotional provenance lives in
`promotional/manifest.json`. `pnpm audit:store-assets` rejects files that do not match these manifests, the
canonical SVG, or the current `dist/SHA256SUMS`. The audit runs inside `pnpm release:package`, so code changes
that alter a release archive require a fresh screenshot pass before packaging can succeed.

After creating release archives, refresh Chrome and Edge screenshots with:

```bash
pnpm capture:store-screenshots -- chrome edge
```

Regenerate the icon and promotional assets with:

```bash
pnpm generate:brand-assets
```

Regenerate the five Chrome listing screenshots after refreshing their source captures with:

```bash
pnpm generate:store-listing-screenshots
```

Firefox capture uses a temporary isolated GeckoDriver profile and exact Firefox release archive:

```bash
MWR_FIREFOX_EXECUTABLE_PATH=/path/to/firefox \
MWR_GECKODRIVER_PATH=/path/to/geckodriver \
pnpm capture:store-screenshots -- firefox
```

Review every image visually before submission. The audit proves provenance and dimensions, not marketing
quality or store acceptance.

## Official specifications

- [Chrome Web Store image guidance](https://developer.chrome.com/docs/webstore/images)
- [Microsoft Edge extension listing properties](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
- [Firefox Add-ons listing guidance](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/)
