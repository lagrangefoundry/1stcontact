---
uid: report-23d42ec4
id: REPORT-483
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T19:24:30.647364+00:00'
updated_at: '2026-07-13T19:24:30.647364+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` (UU) — version-field-only conflict. HEAD (`sync_working_to_main`, post-watermark) = `0.0.105`; incoming (REQ-53 free_coded) = `0.0.97`. Kept `0.0.105`: main has already advanced past the incoming bump, so accepting incoming would regress the package version. The incoming commit's substantive REQ-53 changes are not in package.json (only its version bump was) — they are all in the 8 other files, which were staged cleanly by the cherry-pick with no conflict.

## Incoming changes preserved

All substantive incoming (REQ-53) changes are present and staged:
- `tests/req35-values-diff-noise.test.ts` (M) — REQ-35 suite updated to new exact-by-default policy
- `tests/req47-fidelity-structural.test.ts` (M) — points at explicit `tolerant` opt-out
- `tests/req48-fidelity-axes.test.ts` (M) — points at explicit `tolerant` opt-out
- `tests/req53-values-diff-exact.test.ts` (A) — new REQ-53 UATs
- `tools/generate/src/cli/args.ts` (M)
- `tools/generate/src/cli/capture/values-diff.ts` (M) — exact-by-default + per-metric tolerance overrides
- `tools/generate/src/cli/fidelity.ts` (M)
- `tools/generate/src/cli/index.ts` (M) — `--tolerant` and per-axis `--*-tol` flags

Only package.json carried a conflict, and it contained no REQ-53 code — solely the version bump, which was correctly superseded by main's higher version. No developer code was discarded.
