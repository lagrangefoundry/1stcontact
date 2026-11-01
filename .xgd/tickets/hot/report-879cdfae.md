---
uid: report-879cdfae
id: REPORT-7871
type: report
title: 'Code Review: bundle-39edf66d'
created_by: xgd
created_at: '2026-11-01T22:56:58.234678+00:00'
updated_at: '2026-11-01T22:56:58.234678+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-39edf66d
  anchor_uid: bundle-39edf66d
  overrides_audited: 1
  trust_boundary_overrides: 0
  quality_evidence: report-c0b5b97b
  quality_evidence_commit: 87919984f98bd12571f2b45662019937a94693a9
  reviewer_local_quality_run:
    report_uid: report-270b26f2
    status: error
    cause: sandbox EPERM on 127.0.0.1 listen (workerd); 0 tests executed; environmental,
      not a code result
---

# Code Review

**Result**: PASS

## Summary
The free-coded bundle (REQ-185, REQ-170, REQ-183, REQ-186, BUG-51..56, REQ-188/189) is wired in and passes its quality gates at a commit that comes after every production change on this branch. The one `code_frozen` override (report-4f1b02e8) left two hunks in the tree: InvalidGrantError -> 400, and the ownsBusiness gate on /api/people/status. Both are consistent with REQ-170 and AC-2198/2199/2200. Its third hunk, an ownsBusiness gate on the grant routes, was already recorded as misjudged (report-fb9c667a) and has since been replaced by the operator gate in 0ebff60. The current tree is correct.

**1 overrides audited, 0 touched a trust boundary.**

## Quality Gates
- Evidence is quality report-c0b5b97b at 87919984: lint success (0 errors, 0 warnings), build success, javascript-vitest 230 passed, 0 failed, 0 skipped. Preflight passed.
- `git diff 87919984..HEAD -- apps packages tools db bin` is empty, so the report covers all production code at HEAD.
- The reviewer re-ran `xgd quality run --acs AC2198,AC2199,AC2200`. It produced report-270b26f2 with ERROR: 0 tests executed, because the review sandbox refuses local port binding (EPERM listen 127.0.0.1 for workerd). This is environmental. It is not a test result and does not count against the bundle.

## External Interface Accessibility
Yes. The routes the override touches (POST /api/people/status, /api/grants, /api/grants/revoke) are registered in `routeUncached` (router.ts:1338, 1469, 1506). The new people.ts helpers `businessInScope` and `grantBusinessInScope` are exported and called from router.ts:1477 and 1513. The builder panel threads `canFulfil` into `businessTable`, so Withdraw is offered only to the operator (builder/people.js:386-391, 729-743). The workerd UATs drive these routes through a real Worker and real D1 (test_reconciliation_ownership_and_bypass_split.workers.test.ts, test_reconciliation_contacts_tab_editing.workers.test.ts).

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/router.ts:938 | `refuseNonOwner` is now also used for the operator-only refusal (grant_refused, grant_revoke_refused at 1472/1509), so the name no longer describes every use. Something like `refuseWrite` would be clearer. | Minor |
| apps/control-app/src/router.ts:1379-1386, 1433-1440 | The person_record and invite refusals still inline the same console.warn + 403 block that `refuseNonOwner` exists to centralise. That is three call sites for one pattern; they could use the helper. | Minor |
| apps/control-app/src/router.ts:2053-2058 | InvalidGrantError -> 400 sits beside the InvalidPersonRecordError mapping and passes through `scrub`, the same pattern as the neighbouring entries. Good. | — |
| apps/control-app/src/people.ts:736-762 | Scope confinement: an out-of-scope business or grant gets the same answer as a non-existent one (non-oracle), which matches the /api/people/detail convention. Queries are parameterised. Good. | — |

No debug leftovers, commented-out blocks or TODO stubs in the reviewed hunks.

## Checklist Compliance
No architecture_checklist, security_checklist or design_checklist reports exist, so these sections are skipped.

## Mode Override Audit — report-4f1b02e8 (code_frozen, batch 0, rung 1)
1. Named files only: `files` = `files_touched` = [apps/control-app/src/router.ts]; `unnamed_files_touched` is empty. PASS.
2. Earlier stories' tests pass: report-c0b5b97b (230/0) postdates the override and every later production change. PASS. (The local re-run could not execute; see Quality Gates.)
3. Consistent with intent and AC: the hunks still in the tree are consistent. InvalidGrantError -> 400 serves AC-2198/2199 (empty business or plan, unknown grant id). The /api/people/status ownsBusiness 403 gate, refused before the body is read, serves REQ-170 / DOC-42 §7. The granted grant-route hunk (ownsBusiness) contradicted REQ-183 §6, which makes grants operator-only. That was already recorded as override_misjudged in report-fb9c667a (code_frozen denied for batch 0), and 0ebff60 replaced it with ownsPlatformBusiness plus scope confinement. Nothing of the misjudged hunk is left at HEAD, so it is not raised a second time. PASS on the current tree.
4. Within stated scope: the diff covers exactly the two items in the planner's instructions (error mapping; gates on the three routes), and nothing else in each handler changed. PASS.
5. Trust boundary: `trust_boundary_touched` = false, `trust_boundary_mismatch` = false, `planner_trust_boundary` = true (declared). PASS.
6. code_frozen rung 1: the diff edits only the named file. The surviving behaviour is demanded by REQ-170 / AC-2198..2200. PASS.

## Smoke Test
Entry points tested: none directly by the reviewer. Starting the Worker locally needs a port bind, which this sandbox blocks (EPERM). The routes are exercised end to end by the passing workerd UATs in report-c0b5b97b.

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- The `refuseNonOwner` name no longer covers the operator-gate refusals, and the person_record/invite refusals duplicate its body inline (router.ts:938, 1379, 1433).
- Process: commit 0ebff60 (fix_reconciliation_review) edited production code (router.ts, people.ts, builder/people.js) in reconcile mode with no mode_override report. The previous reconciliation review already recorded this as `unrecorded_production_change`. The change itself is correct and tested, but the workflow should record such edits as an override.

## Fix-It Prompt
N/A (PASS)
