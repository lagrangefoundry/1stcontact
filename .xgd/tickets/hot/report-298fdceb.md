---
uid: report-298fdceb
id: REPORT-7141
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:25:24.903478+00:00'
updated_at: '2026-10-31T23:25:24.903478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts`: DU, class 2a/2f, BUG-1301 precedence. Left absent, matching HEAD. This file has never existed on main or on HEAD's lineage. REQ-167's reconciliation (BUNDLE-23, commit b1ddd11d3b `reconciliation_uat_generation_prompt`) rewrote the FC UAT into `tests/reconciliation-identity-invite-and-admission.workers.test.ts` and deleted the original. That deletion was a legitimate, documented reconcile step, not churn, so the incoming hunk's whole target is already gone from HEAD.
- `package.json`: auto-merged by git, but the incoming commit itself contains literal conflict markers. The bundle ticket documents this: 6cddcbb1c4 was committed inside a conflicted merge, and the raced commit that caused it is repaired later by 68db393777. Resolved to `"version": "0.2.50"`, the commit's stated intent ("bump to 0.2.50"), and checked as valid JSON.
- `apps/control-app/src/identity.ts`, `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts`: applied cleanly, and the staged content is identical to 6cddcbb1c4.

No path outside 6cddcbb1c4's own diff is staged. `tests/reconciliation-identity-invite-and-admission.workers.test.ts` was restored to HEAD.

## Incoming changes preserved

- identity.ts: identical to the incoming version (`git diff --cached CHERRY_PICK_HEAD` is empty).
- REQ-178 businesses UAT: identical to the incoming version.
- package.json: the incoming 0.2.50 is preserved. Only the marker lines and the stale `0.2.48` side are dropped.
- REQ-167 FC UAT hunk: dropped under the BUG-1301 precedence exception. The hunk moves two assertions from `accountId`/`entitlement` to `businesses[]`. Its target file was deleted on main by b1ddd11d3b, BUNDLE-23's reconciliation of REQ-167, which replaced it with the reconciliation test.

FLAG FOR POST-MERGE REVIEW: `tests/reconciliation-identity-invite-and-admission.workers.test.ts` still reads the singular admission fields that REQ-178 removes: `first.accountId`, `first.entitlement.id` and `second.accountId` (around lines 362-372), and `open.entitlement.plan` and `bounded.entitlement.plan` (around lines 525-533). These need the same `businesses[0]` migration. Separately, the REQ-178 amendment later in the bundle makes `no_entitlement` stop refusing, so the refusal assertions around lines 425, 439, 459 and 477 will need to move to `selectable`. That file is outside this commit's diff, so it was left untouched here.
