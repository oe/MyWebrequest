# Release Checklist

Status: Local package gate implemented; installed-browser and store certification pending  
Last updated: 2026-09-01

Never mark a browser supported from build output alone. Record the browser version, artifact checksum,
test date, and evidence for every completed row.

## 1. Create candidate artifacts

Use Node.js 24 and pnpm 11 from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm release:package
```

This runs the complete repository gate, creates Chrome, Edge, Firefox, and Firefox source archives in
`dist/`, re-audits the final package directories, and writes `dist/SHA256SUMS`. Do not rebuild an archive
after recording its checksum.

CI runs the same command on Node.js 24 and uploads the four archives plus `SHA256SUMS` as one immutable
workflow artifact. Use that artifact for installed-browser testing and store submissions so the tested
package and submitted package are identical.

## 2. Installed-browser matrix

Run each scenario on the current stable browser and one supported older release.

| Scenario                                         | Chrome | Edge | Firefox |
| ------------------------------------------------ | ------ | ---- | ------- |
| Clean install has no required host access        | ☐      | ☐    | ☐       |
| Popup and options open with no console errors    | ☐      | ☐    | ☐       |
| Block rule works without host access             | ☐      | ☐    | ☐       |
| HTTPS-upgrade rule works without host access     | ☐      | ☐    | ☐       |
| Navigation redirect grant, refusal, and re-grant | ☐      | ☐    | ☐       |
| Subresource redirect requests initiator access   | ☐      | ☐    | ☐       |
| Request-header rule requests initiator access    | ☐      | ☐    | ☐       |
| Permission revocation removes affected DNR rules | ☐      | ☐    | ☐       |
| Service-worker/background restart reconciles DNR | ☐      | ☐    | ☐       |
| Popup/options/storage state stays synchronized   | ☐      | ☐    | ☐       |
| Legacy migration review/export/apply/rollback    | ☐      | ☐    | ☐       |
| Backup merge/replace and recovery snapshot       | ☐      | ☐    | ☐       |
| Six locales pass keyboard and 200% zoom smoke    | ☐      | ☐    | ☐       |

For redirects and request-header rules, verify both the matched request origin and explicit initiator
origins appear in the product explanation before the browser prompt. A rule must never be shown as active
when either permission is missing.

## 3. Store validation

| Gate                                                         | Chrome Web Store | Edge Add-ons | AMO |
| ------------------------------------------------------------ | ---------------- | ------------ | --- |
| Package accepted by validator                                | ☐                | ☐            | ☐   |
| Permission disclosure matches the generated manifest         | ☐                | ☐            | ☐   |
| Privacy statement matches runtime and contains no telemetry  | ☐                | ☐            | ☐   |
| Screenshots come from the exact checksummed release artifact | ☐                | ☐            | ☐   |
| Upgrade from the previous public version preserves data      | ☐                | ☐            | ☐   |

## 4. Sign-off record

Record one row per artifact in the release issue or changelog:

| Browser | Version tested | Artifact filename | SHA-256 | Tested at | Evidence link | Result |
| ------- | -------------- | ----------------- | ------- | --------- | ------------- | ------ |
|         |                |                   |         |           |               |        |

Release only browser rows that have passed both sections 2 and 3. Keep failed or untested targets in the
build matrix as experimental and do not advertise them as supported.
