---
uid: report-b84fc1fe
id: REPORT-466
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:52:54.689875+00:00'
updated_at: '2026-07-13T18:52:54.689875+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` (UU) — version-counter conflict only: HEAD (`sync_working_to_main`, post-watermark) had `0.0.105`; incoming free_coded commit bumped `0.0.81 → 0.0.82`. Version must move monotonically and main has advanced past the incoming bump, so kept `0.0.105`. This is bookkeeping, not developer code; incoming's substantive changes live in the four files below.

## Incoming changes preserved

The incoming commit `a4edf8db` (feat(framework): fc-row content measure + services-grid card-title weight/face) touched five files. The four code/test files applied cleanly (staged as `M`) and were verified identical to the incoming commit's versions:

- `packages/framework/src/modules/row.ts` — IDENTICAL to incoming (rowWidth content-measure boxing)
- `packages/framework/src/modules/services-grid/index.astro` — IDENTICAL to incoming (cardTitleWeight/cardTitleFont dials)
- `packages/framework/src/modules/services-grid/meta.ts` — IDENTICAL to incoming (new meta dials)
- `tests/req36-heading-treatment.test.ts` — IDENTICAL to incoming (5 new test_UAT_FC_REQ-36_* cases)

Only `package.json`'s version field was superseded (correct bookkeeping resolution). All substantive developer changes are present in the resolved tree. No conflict markers remain; staging is clean and ready for cherry-pick continuation.
