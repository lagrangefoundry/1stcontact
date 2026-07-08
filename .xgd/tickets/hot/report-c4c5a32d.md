---
uid: report-c4c5a32d
id: REPORT-293
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-07-08T19:39:09.122903+00:00'
updated_at: '2026-07-08T19:39:09.122903+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-2ed897ed
  parent_report_uid: report-fa13889f
  batch_index: '0'
---

Deterministic — 91/91 pass on both runs, ~8s each.

## Assessment

**Failure:** `javascript-vitest: suite_error` — the vitest suite `tests/reconciliation-platform-scaffold.test.ts > AC-416 public-site apex placeholder` failed to start its worker with a fatal workerd exception:
```
*** Fatal uncaught kj::Exception: workerd/util/sqlite.c++:844: failed: SENTRY_DO SQLite failed;
NOSENTRY database is locked: SQLITE_BUSY (extended: SQLITE_BUSY_RECOVERY)
MiniflareCoreError [ERR_RUNTIME_FAILURE]: The Workers runtime failed to start.
```
The `beforeAll` hook hung on the failed runtime startup and hit the 60s timeout.

**Diagnosis (which of the three):** Test-harness bug, not a production bug or a stale AC.
- The production workers (`apps/public-site/src/index.ts`, `apps/control-app/src/index.ts`) are trivial placeholders returning a static string — no storage bindings, no logic that could produce a SQLite error. AC-416/AC-417 correctly describe this behavior.
- The `SENTRY_DO` SQLite lock is **Miniflare's internal** state, not the worker's. Three test files (`reconciliation-platform-scaffold`, `public-site`, `control-app`) each call `unstable_dev`, which spawns a real `workerd`. Vitest runs test files in parallel, so multiple `workerd` processes concurrently opened Miniflare's **default shared persistence directory** (`.wrangler/state`) → `SQLITE_BUSY_RECOVERY` → runtime startup failure. It surfaced on whichever worker lost the race (here, public-site).

**Fix (action #3 — fix the test harness):** Added `persist: false` to all four `unstable_dev` call sites across the three files. These placeholder workers have no storage, so in-memory-only state is fully correct and eliminates the shared filesystem resource that the parallel processes were contending on. I fixed all four (not just AC-416) because they contend on the *same* directory — fixing one leaves the rest fighting over it.

The fix does not weaken any assertion — every test still asserts the exact status, content-type, and body. A broken implementation would still fail these tests.

**Verification:** Full `npx vitest run` passes 91/91 deterministically across two consecutive runs (~8s each, down from the 68s that included the 60s timeout). Edits are confined to `tests/`.

One note: the batch verification command `xgd quality run --test-filter-expression "javascript-vitest: suite_error"` treats the failure identifier as a vitest test-name filter, which matches zero tests and reports "0 tests executed." That's a limitation of that filter string for JS suites — the underlying failure is genuinely fixed, as the unfiltered run confirms.
