# Release Checklist

Status: Candidate sign-off requires final-commit CI, signed store-upgrade verification and applicable store approval.
Last updated: 2026-09-09

This document owns release gates. Historical checks below are evidence for their recorded candidates only; revalidate them against the exact commit and archive being released. This documentation cleanup did not inspect current CI, deployment, or store portals.

Never mark a browser supported from build output alone. Record the browser version, artifact checksum,
test date, and evidence for every completed row.

## 1. Create candidate artifacts

Use Node.js 24 and pnpm 11 from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm release:package
```

This runs the complete repository gate, creates Chrome, Edge, Firefox, and Firefox source archives in
`dist/`, rejects stale or unexpected ZIP files, re-audits the final package directories, writes
`dist/SHA256SUMS`, and rebuilds all four archives to prove byte-for-byte reproducibility. Do not modify an
archive after recording its checksum.

CI runs the same command on Node.js 24. After every declared-floor browser suite passes on native Linux x86-64,
it writes `browser-floor-certification.json` with the commit, workflow run, observed browser versions, artifact
filenames, and verified SHA-256 values. CI uploads that record with the four archives and `SHA256SUMS` as one
immutable workflow artifact. Use that artifact for installed-browser testing and store submissions so the
tested package and submitted package are identical. The report generator refuses non-Linux/non-x86 runners,
wrong browser versions, and archives that do not match `SHA256SUMS`.

## Historical evidence

Earlier candidate observations are preserved in [RELEASE_EVIDENCE.md](../archive/RELEASE_EVIDENCE.md).

## 2. Installed-browser matrix

The tables retain historical results from the archived evidence log. A check mark is not certification of the current HEAD or a newly built archive.

| Scenario                                         | Chrome | Edge | Firefox |
| ------------------------------------------------ | ------ | ---- | ------- |
| Clean install has no required host access        | ✓      | ✓    | ✓       |
| Popup and options open with no console errors    | ✓      | ✓    | ✓       |
| Block rule works without host access             | ✓      | ✓    | ✓       |
| HTTPS-upgrade rule works without host access     | ✓      | ✓    | ✓       |
| Navigation redirect grant, refusal, and re-grant | ✓      | ✓    | ✓       |
| Subresource redirect requests initiator access   | ✓      | ✓    | ✓       |
| Request-header rule requests initiator access    | ✓      | ✓    | ✓       |
| Permission revocation removes affected DNR rules | ✓      | ✓    | ✓       |
| Service-worker/background restart reconciles DNR | ✓      | ✓    | ✓       |
| Popup/options/storage state stays synchronized   | ✓      | ✓    | ✓       |
| Legacy migration review/export/apply/rollback    | ✓      | N/A  | N/A     |
| Backup merge/replace and recovery snapshot       | ✓      | ✓    | ✓       |
| Six locales pass keyboard and 200% zoom smoke    | ✓      | ✓    | ✓       |

For redirects and request-header rules, verify both the matched request origin and explicit initiator
origins appear in the product explanation before the browser prompt. A rule must never be shown as active
when either permission is missing.

Legacy migration is N/A for Edge and Firefox because no legacy version was published for either browser.
Their release artifacts must omit migration from primary navigation and Settings and must not scan legacy
page storage.

### Declared-floor matrix

A newer browser passing does not certify these rows. Chromium and Edge use version 121; Firefox uses 142.

| Scenario                                       | Chrome 121 | Edge 121 | Firefox 142 |
| ---------------------------------------------- | ---------- | -------- | ----------- |
| Exact release artifact installs                | ☐          | ☐        | ✓           |
| Install has no required host access            | ☐          | ☐        | ✓           |
| Production options page opens                  | ☐          | ☐        | ✓           |
| Hostless block affects a real request          | ☐          | ☐        | ✓           |
| Regex and total quota boundaries converge      | ☐          | ☐        | ✓           |
| Background/add-on reload reconciles DNR        | ☐          | ☐        | ✓           |
| HTTPS upgrade works without host access        | ☐          | ☐        | ✓           |
| Redirect/header permission lifecycle           | ☐          | ☐        | ✓           |
| Cross-origin capture and header modification   | ☐          | ☐        | ✓           |
| Popup, storage, backup, locales, accessibility | ☐          | ☐        | ✓           |
| Legacy migration lifecycle                     | ☐          | N/A      | N/A         |

## 3. Store validation

| Gate                                                           | Chrome Web Store | Edge Add-ons | AMO |
| -------------------------------------------------------------- | ---------------- | ------------ | --- |
| Local package and metadata preflight                           | ✓                | ✓            | ✓   |
| AMO-compatible package lint                                    | N/A              | N/A          | ✓   |
| Package accepted by the store portal                           | ☐                | ☐            | ☐   |
| Permission disclosure matches the generated manifest           | ✓                | ✓            | ✓   |
| Privacy statement matches runtime and contains no telemetry    | ✓                | ✓            | ✓   |
| Six localized descriptions and screenshot captions             | ✓                | ✓            | ✓   |
| Legacy migration copy is limited to the Chrome listing         | ✓                | ✓            | ✓   |
| Screenshots come from the exact checksummed release artifact   | ✓                | ✓            | ✓   |
| Original store icon and generated runtime icon matrix          | ✓                | ✓            | ✓   |
| Audited 440x280 promotional tile                               | ✓                | ✓            | N/A |
| Signed upgrade from the previous public version preserves data | ☐                | N/A          | N/A |

## 4. Sign-off record

Record one row per artifact in the release issue or changelog:

| Browser | Version tested | Artifact filename | SHA-256 | Tested at | Evidence link | Result |
| ------- | -------------- | ----------------- | ------- | --------- | ------------- | ------ |
|         |                |                   |         |           |               |        |

For the declared-floor rows, use the uploaded `browser-floor-certification.json` run URL and values. Do not
copy versions or hashes from an untrusted log line or reconstruct a certification record locally.

Release only browser rows that have passed both sections 2 and 3. Keep failed or untested targets in the
build matrix as experimental and do not advertise them as supported.
