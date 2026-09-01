# Store assets

The committed screenshots under `screenshots/<browser>/` are 1280x800, full-bleed captures of the real
extension UI. Each browser set tells the same three-part product story: rule management, the bounded
website-access explanation, and verified backup import preview.

- Chrome Web Store accepts 1280x800 or 640x400 screenshots and recommends the larger size.
- Microsoft Edge Add-ons accepts 1280x800 or 640x480 screenshots.
- Firefox Add-ons recommends 1280x800 and a 1.6:1 ratio for other sizes.

The browser-specific source archive, archive checksum, browser version, image dimensions, and image checksum
are recorded in `screenshots/manifest.json`. `pnpm audit:store-assets` rejects images that do not match that
manifest or the current `dist/SHA256SUMS`. The audit runs inside `pnpm release:package`, so code changes that
alter a release archive require a fresh screenshot pass before packaging can succeed.

After creating release archives, refresh Chrome and Edge screenshots with:

```bash
pnpm capture:store-screenshots -- chrome edge
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
