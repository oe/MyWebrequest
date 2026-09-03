# Store assets

The committed screenshots under `screenshots/<browser>/` are 1280x800, full-bleed captures of the real
extension UI. Each browser set tells the same three-part product story: rule management, the bounded
website-access explanation, and verified backup import preview.

The upload-ready Chrome listing story lives under `listing-screenshots/chrome/en-US/`. It contains the
recommended maximum of five 1280x800 images, adapting Goldie's product-first framing to Chrome's landscape
format. These are deterministic compositions over the exact audited Chrome captures; the source captures
remain untouched for release provenance.

`listing/<locale>.json` contains paste-ready store metadata for English, Simplified Chinese, Korean,
Japanese, French, and Spanish. The shared descriptions intentionally contain no browser-specific migration
claim. Only `chromeLegacyMigrationNote` may be appended to the Chrome listing; it must never be copied to
Edge Add-ons or AMO.

The canonical icon lives at `brand/app-icon.svg`. `pnpm generate:brand-assets` renders the runtime
16/32/48/96/128px PNG matrix, Edge's 300px listing logo, Chrome/Edge 440x280 promotional tiles, and Chrome's
optional 1400x560 marquee tile. The promotional artwork adapts Goldie's product-first framing to extension
store proportions: the legacy blue globe stays recognizable while verified, current UI is presented inside a
browser-window frame. The saturated full-bleed artwork avoids relying on marketing copy that cannot be
localized in Chrome's global promotional-image fields.

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
