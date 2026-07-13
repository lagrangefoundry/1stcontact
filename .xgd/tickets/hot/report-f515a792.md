---
uid: report-f515a792
id: REPORT-467
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:54:45.749603+00:00'
updated_at: '2026-07-13T18:54:45.749603+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` (UU, config/version scalar): conflict was solely the `version`
  field — HEAD (`sync_working_to_main`, post-watermark) `0.0.105` vs incoming
  (`free_coded`) `0.0.83`. Kept `0.0.105` — the higher, more-recent accumulated
  version. Incoming's `0.0.82→0.0.83` bump is bookkeeping already subsumed by
  main's version; taking `0.0.83` would have rolled the package version
  backwards. No developer code lives in this field. After resolution the file
  matches HEAD, so it drops out of `git status` (correct).

## Incoming changes preserved

The incoming commit (0e93cbad "header logo frame + footer social icons") touched
six files. The five code/test files applied cleanly during cherry-pick and are
staged as `M`; each was verified to match the incoming commit exactly:

- `packages/framework/src/modules/dials.ts` — matches incoming exactly
- `packages/framework/src/modules/footer/index.astro` — matches incoming exactly
- `packages/framework/src/modules/footer/meta.ts` — matches incoming exactly
- `packages/framework/src/modules/header/index.astro` — matches incoming exactly
- `tests/req36-heading-treatment.test.ts` — matches incoming exactly (5 new UATs)

The only file that conflicted was `package.json`, which carried no developer code
from the incoming commit beyond the version bump (superseded). No incoming code
was discarded.
