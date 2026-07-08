---
uid: report-b9496ffb
id: REPORT-302
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-07-08T19:54:20.769746+00:00'
updated_at: '2026-07-08T19:54:20.769746+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-2ed897ed
  parent_report_uid: report-509d5b1b
  batch_index: '0'
---

The batch failure is resolved. Here is my assessment.

## Diagnosis

**Failure:** `javascript-vitest: suite_error` — message `Failed to run suite: '<' not supported between instances of 'NoneType' and 'float'`.

**Root cause (from the session log at 12:34):** This was a *compound* failure, not a JS assertion failure:
1. The vitest suite **executed 0 tests** ("Test suite failed to run"). The three test files using Cloudflare's `unstable_dev` (`control-app`, `public-site`, `reconciliation-platform-scaffold`) spin up Miniflare/`workerd` workers in parallel `beforeAll` hooks. They shared the default `.wrangler/state` dir, causing **SQLITE_BUSY contention** on Miniflare's internal SQLite during worker startup → workers failed to boot → the suite aborted with 0 tests collected.
2. With 0 tests, coverage came back `None`, and the XGD quality runner crashed comparing `None < <float threshold>` — surfacing as the `suite_error` signature. (The runner itself flags this as an infrastructure bug: *"Claude cannot fix infrastructure bugs."*)

This is **not** one of the three stabilize outcomes (stale test / stale matrix / production bug) — it was an environmental parallel-startup race.

## Resolution status

The fix already landed in a prior batch of the **same reconcile bundle** (`6a071846`), commit `2e1eb84`, which added `persist: false` to the affected `unstable_dev` calls (placeholder workers have no storage bindings, so filesystem persistence is unnecessary and eliminates the shared-state contention).

I verified the fix is **complete and stable** — I did not need to add any new edits:

- **Completeness:** all **4** `unstable_dev` calls across the 3 files now carry `persist: false` (1 + 1 + 2), so no un-patched call can re-trigger SQLITE_BUSY.
- **Stability:** ran the full suite 3× → **91/91 tests pass** every time, no 0-tests recurrence.
- **Batch verification:** `xgd quality run --test-filter-expression "javascript-vitest: suite_error"` → **Overall Status: SUCCESS** (0 errors).

No further changes to code, tests, or the capability matrix are warranted — the suite is green and the underlying startup race is fixed.
