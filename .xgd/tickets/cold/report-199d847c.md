---
uid: report-199d847c
id: REPORT-869
type: report
title: 'Resync resolve conflicts: f72504735d5405af1376d8b1ddd218c0bc1ba4ea'
created_by: xgd
created_at: '2026-07-24T06:06:12.047372+00:00'
updated_at: '2026-07-24T06:06:12.047372+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — UU (both modified). Version scalar conflict: ours (sync_working_to_main) `0.0.191` vs incoming (`feat(l1): fold image + surface leaves` [FREE-CODED]) `0.0.179`. Applied config-scalar / higher-version rule: kept `0.0.191` (the main-rooted resync tip must never be downgraded by an incoming free-coded bump). Only the version line conflicted; all other package.json fields were identical.

## Incoming changes preserved

The incoming commit's substantive changes are non-package.json and applied cleanly (no overlap): `tests/req92-image-box-fold.test.ts`, `tools/generate/src/cli/capture/{extract,sections,types,values-diff}.ts`, `tools/generate/src/l1/{fold,index,probes}.ts`. HEAD `2817c003` carries all 8 incoming files; the only conflicted file (package.json) contributed no incoming code, only a version bump superseded by the newer resync version. Tree is clean, no conflict markers remain, staging is ready for cherry-pick continuation.
