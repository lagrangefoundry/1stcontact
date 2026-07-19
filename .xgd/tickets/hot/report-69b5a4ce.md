---
uid: report-69b5a4ce
id: REPORT-594
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T02:02:30.821780+00:00'
updated_at: '2026-07-19T02:02:30.821780+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — class UU (both modified, version field). Rule: enriched "take more recent commit by timestamp" — OURS (sync_working_to_main, 2026-07-18, version 0.0.155) is newer than incoming free-coded (2026-07-16, version 0.0.131). Kept 0.0.155. Incoming's only package.json change was a version bump 0.0.130→0.0.131, superseded by HEAD; no developer code lost. Flagged for post-merge review per rule. Staged.
- `packages/framework/src/modules/dials.ts` — applied cleanly during cherry-pick (no marker), staged M.
- `packages/framework/src/modules/hero/index.astro` — applied cleanly, staged M.
- `packages/framework/src/modules/text-block/index.astro` — applied cleanly, staged M.
- `tests/req36-heading-treatment.test.ts` — applied cleanly, staged M.

## Incoming changes preserved

Verified via `git patch-id --stable` comparison of each staged diff-vs-HEAD against the incoming commit (58be1d98) diff:

- dials.ts — patch-id 67f4589d MATCH (staged diff identical to incoming)
- hero/index.astro — patch-id c97dc2a9 MATCH
- text-block/index.astro — patch-id 5f583afb MATCH
- tests/req36-heading-treatment.test.ts — patch-id 10ca153f MATCH

All four code files carry the incoming radius-dials refactor exactly as authored. package.json incoming change was a version bump only (bookkeeping), correctly superseded by the newer OURS version per the timestamp rule. No conflict markers remain; CHERRY_PICK_HEAD sequencer state untouched.
