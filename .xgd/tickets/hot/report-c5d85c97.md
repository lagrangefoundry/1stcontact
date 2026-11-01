---
uid: report-c5d85c97
id: REPORT-7206
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T02:06:57.583043+00:00'
updated_at: '2026-11-01T02:06:57.583043+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-159
  parent_report_uid: report-2db26efc
  batch_index: '0'
---

AC-2080 now passes: a deployed `capture_site` writes one reference ticket with a record for each member of the bundle. I fixed the production code that was missing, not the test. The only file I changed is `apps/control-app/src/router.ts`, which this batch's exception allowed.

**What changed in `router.ts`:**
- `sessionFidelity` now takes the request's `TicketStore`. Its one caller, in `chatHost`, already had `tickets` and now passes it in.
- I added a small `adopt(bundle)` function. It calls `adoptCapture` with the tenant's reference bundle, an empty args object (no `clientDomain`, since REQ-474 is out of scope), and the same indexer and describer that `/api/material` uses. It looks up the indexer each time a bundle is adopted, not once per session. It returns `{ uid: adopted.ticket.uid, created: adopted.created }`.
- `adopt` is passed to `fidelityDeps` as the argument after the launch options.
- I did not touch `shot.ts`, `fidelity-core.ts`, `capture-material.ts`, the test or the AC.

**Checks:**
- `tsc --noEmit` for the control app runs clean.
- `tests/test_reconciliation_capture_site_reference_material.workers.test.ts`: 6 of 6 tests pass, including AC-2080.
- All seven test files that contain the scoped tests (AC2024/2025/2044/2080–2084, FC_REQ-166, FC_REQ-157): 50 of 50 pass.
- The workers test run prints "uncaught exception … internal error" lines and an EPERM error on the wrangler log file. The run still reports every test passing; I did not check whether those messages were there before my change.
- The tool permissions blocked one of my commands (a loop that found and ran the scoped files in one step), so I listed the seven files and ran them by name instead.

I didn't commit anything, because the outer reconcile run handles commits. No AC or story needed changing: the test and AC-2080 were already correct.

```yaml
## Assessment
status: fixed
files_changed:
  - apps/control-app/src/router.ts
tests:
  target: "test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member — PASS"
  scope: "7 files, 50/50 passed"
upstream_changes: none
```
