# Changelog

## 1.0.1

- Improve recovery when saving rules is interrupted and reduce background synchronization work.
- Improve responsiveness when managing large rule collections.
- Show the applied global pause state in the toolbar icon and tooltip.
- Fix the popup Appearance menu's spacing, sizing, and narrow-window layout.
- Replace bundled Geist fonts with system fonts to reduce extension size.
- Correct the publisher name to `forthink` and add the publisher website link in Settings.
- Refresh store screenshots and strengthen release and browser compatibility checks.

This update preserves the extension ID, rule storage schema, backup format, and declared permissions.

## 1.0.0

Initial RequestOrbit release, published in the Chrome Web Store on September 8, 2026.

- Manifest V3 request rules for redirects, blocking, HTTPS upgrades, and request headers.
- Guided redirect creation, URL previews, scoped optional website access, and local backups.
- Six interface languages and light/dark appearance.

The retrospective `v1.0.0` tag points to `d1f338f3a9694c121c01ba2ff77a27159450ba9b`,
the original stable-release preparation commit. On September 11, 2026, rebuilding that commit
matched the installed Chrome Web Store 1.0.0 JavaScript, CSS, HTML, icons, fonts, and locale values.
The only installed-package differences were the store-added `update_url` and locale JSON formatting.
