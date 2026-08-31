# Privacy Policy

Last updated: 2026-09-01

My Webrequest is a local-only browser extension. It does not collect, transmit, sell, or share personal
data. It has no account system, analytics, advertising, telemetry, cloud synchronization, or
product-owned network endpoint.

Rules, preferences, migration reports, and recovery snapshots are stored locally in the browser's
extension storage. The extension does not store request bodies, browsing history, cookies,
authentication data, or incognito activity.

## Permissions

- `storage` stores rules and preferences on the device.
- `declarativeNetRequestWithHostAccess` lets the browser apply user-authored request rules without the
  extension reading request contents.
- `activeTab` lets the popup identify the current HTTP or HTTPS site after the user opens it.
- Optional `http://*/*` and `https://*/*` host access is not granted at installation. My Webrequest asks
  only for the concrete origins needed by a rule when the user chooses to enable it.

Exporting a backup writes a JSON file chosen by the user. Importing reads only the file the user selects.
Neither operation sends data over the network.

Questions and issue reports should use the support channel published with the extension listing. Do not
include private rule data unless you intentionally choose to share it.
