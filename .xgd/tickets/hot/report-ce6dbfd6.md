---
uid: report-ce6dbfd6
id: REPORT-700
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-7'
created_by: xgd
created_at: '2026-07-22T19:06:57.003926+00:00'
updated_at: '2026-07-22T19:06:57.003926+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-7
---

## Files resolved

- `package.json` — class UU (config/scalar). Only the `version` field conflicted:
  HEAD (`sync_working_to_main`, post-watermark) = `0.0.169`; incoming (free_coded)
  = `0.0.161`. Intent unknown on one side → "take more recent by timestamp" rule.
  Kept `0.0.169` (the higher, already-advanced current-branch version); the incoming
  `0.0.161` was a stale bump. Flagged for post-merge review per enrichment rule.

## Incoming changes preserved

All incoming code changes are present in the resolved cherry-pick commit `3fa61e3d`
(9 files, +804 lines):
- tests/req83-capture-to-l1-fold.test.ts (new, +283)
- tools/generate/src/cli/capture/hints.ts (new, +231)
- tools/generate/src/l1/fold.ts (new, +165)
- tools/generate/src/cli/capture/{bundle,capture,index,pipeline}.ts (modified)
- tools/generate/src/cli/index.ts, tools/generate/src/l1/index.ts (modified)

The only conflict was the package.json `version` scalar; no incoming code was
discarded. Tree is clean, no conflict markers remain.
