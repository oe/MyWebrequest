# Runtime optimization verification — 2026-09-08

The background now owns routine rule commits, records a temporary recovery intent before changing DNR,
and completes interrupted commits after restart. A lost response channel is resolved by reading the
committed outcome; the client does not blindly replay the write. Concurrent stale writes are rejected.
Legacy migration retains its separate state-plus-migration compensation transaction.

Unchanged UI opens skip reconciliation. DNR writes contain only actual differences, permissions are read
once per batch, and regex support results are cached. Language changes update toolbar text only. Wildcard
cycle diagnostics narrow candidates by literal prefix before using the original matcher. Arbitrary regex
and unanchored patterns can still require pairwise checks. Lists render at most 100 rows, with full-list
search and keyboard navigation across pages. No permissions, dependencies, content scripts, or request
listeners were added. The paused amber icon and error `!` remain; there is no `B` badge.

## Before/after observations

Baseline: `f627ab6`. Both measurements used a production Chrome build in an isolated headed Chromium
profile. The test-only copy granted `http://127.0.0.1/*` for valid redirect fixtures; production permissions
were unchanged. Browser API wrappers counted calls while delegating to the real APIs. Popup HTML was
opened in a tab, not the native toolbar popup. Rule installation counts were verified before each case.

| Scenario                                                           | Before                | After                            |
| ------------------------------------------------------------------ | --------------------- | -------------------------------- |
| Open popup, 500 exact redirects: permission reads                  | 1,000                 | 1                                |
| Same open: DNR writes                                              | 1, remove/add all 500 | 0                                |
| Open popup, 500 wildcard redirects: regex support calls            | 500                   | 0                                |
| Same wildcard open: readiness / longest page task                  | 271 ms / 109 ms       | 139 ms / no task ≥50 ms observed |
| Change language, 100 rules: DNR writes                             | 1, remove/add all 100 | 0                                |
| Pause with options and popup open: DNR writes                      | 4 (3 redundant)       | 1                                |
| Options with 4,500 exact redirects: rendered rule rows / DOM nodes | 4,500 / 72,245        | 100 / 1,853                      |
| Same options open: readiness / longest page task                   | 1,552 ms / 497 ms     | 401 ms / 79 ms                   |

Timing values are single local observations, not percentiles or cross-device promises. No long-term
CPU, memory, battery, or general webpage throughput benchmark was performed. The steady-state request
path remains browser-native DNR.

## Correctness and regression evidence

- `pnpm check`: 233 unit tests and 27 Chromium E2E tests passed, plus formatting, lint, strict typing,
  site checks/build, security checks, three-browser builds, artifact audit, and Firefox lint.
- `tests/e2e/runtime-performance.spec.ts`: no-op writes, delayed background save after popup closure,
  durable intent recovery after browser restart, and bounded rendering with cross-page keyboard navigation.
- `tests/unit/runtime-controller.test.ts` and `runtime-client.test.ts`: stale writers, compensation,
  permission invalidation during reconciliation, response-channel loss, and bounded read timeouts.
- Existing E2E coverage still proves real blocking, redirects, headers, permissions, backups, and migration.
  The unpacked legacy-update fixture now unloads the old worker registration before relaunching; a raw
  disk overlay had left Chromium messaging routed away from the new worker. Backup automation waits for
  its disabled file input to become enabled before selecting another file.
- Headed Firefox 155.0.1 focused verification passed: background messaging, a real blocked request with
  zero server hits, popup pause/resume, 4,500 installed rules with 100 mounted rows, and journal recovery
  after add-on reload. The complete Firefox runtime script did not finish its settings-menu visibility
  lookup, so this is focused runtime evidence, not full Firefox UI certification.
