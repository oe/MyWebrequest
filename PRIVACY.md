# Privacy Policy

Last updated: 2026-09-05

RequestOrbit is a local-only browser extension. It does not collect, transmit, sell, or share personal
data. It has no account system, analytics, advertising, telemetry, cloud synchronization, or
product-owned network endpoint.

Rules, preferences, migration reports, and recovery snapshots are stored locally in the browser's
extension storage. The extension does not automatically read or record request bodies, browsing history,
cookies, authentication credentials, or incognito activity. Values you enter yourself, including URLs
and request headers such as Authorization, are part of your rules. They may contain credentials and
are stored locally and included in exported backups. Backups are not encrypted; keep them private and
review their contents before sharing them.

## Permissions

- `storage` stores rules and preferences on the device.
- `declarativeNetRequest` lets the browser apply user-authored request rules without the extension reading
  request contents. Safe block and HTTPS-upgrade rules need no website access.
- `activeTab` lets the popup identify the current HTTP or HTTPS site after the user opens it.
- Optional `http://*/*` and `https://*/*` host access is not granted at installation. RequestOrbit asks
  only for the concrete request and, when required, initiator origins needed by a redirect or header rule
  when the user chooses to enable it.

Exporting a backup writes a JSON file chosen by the user. Importing reads only the file the user selects.
Neither operation sends data over the network.

Questions and issue reports should use the support channel published with the extension listing. Do not
include private rule data unless you intentionally choose to share it.
