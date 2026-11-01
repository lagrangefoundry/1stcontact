---
uid: report-0e9de615
id: REPORT-7371
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:22:23.919787+00:00'
updated_at: '2026-11-01T06:22:23.919787+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- package.json (config / UU): kept HEAD ("version": "0.2.57", from 2d59060f2e, BUG-46, 2026-10-31). Rule: take the newer commit by timestamp. The incoming 6cddcbb1c4 (REQ-175, 2026-09-02) is older, and its package.json already contained committed conflict markers (0.2.50 / 0.2.48 from free-REQ-178), so it isn't a valid version value to apply. Flagged for post-merge review per the enrichment rule. A version bump going backwards on a reconcile branch would be wrong anyway.
- tests/test_UAT_FC_REQ-167_identity.workers.test.ts (UAT test / DU): ran git rm. HEAD never had this file. Its REQ-167 coverage was folded into tests/reconciliation-identity-invite-and-admission.workers.test.ts and tests/reconciliation-identity-multi-business-admission.workers.test.ts by the reconciliation_uat_generation workflow (9539491cd2) and later quality fixes (334d5dda2a).

## Incoming changes preserved

- The incoming commit's other changes (apps/control-app/src/identity.ts, tests/test_UAT_FC_REQ-178_businesses.workers.test.ts) applied cleanly and already match HEAD. HEAD's identity.ts already carries the `businesses: AdmittedBusiness[]` admission shape with no singular accountId.
- REQ-167 test hunk (BUG-1301 precedence): the hunk moves assertions from `result.accountId` / `result.entitlement.plan` to `result.businesses[...]`. Its target file was replaced by a documented reconciliation-suite consolidation already integrated into HEAD. That suite already asserts the businesses shape (e.g. lines 369-385 and 540), so the incoming intent is present in HEAD. This is not a resolution shortcut.
- Net staged diff vs HEAD is empty: the commit is redundant on this branch (BUG-1109/BUG-1122 shape). Finalize should skip it.

## Arbitration of last resort (BUG-1460)

Not used.
