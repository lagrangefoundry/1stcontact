---
uid: report-bbbbeac9
id: REPORT-7437
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:03:43.942919+00:00'
updated_at: '2026-11-01T07:03:43.942919+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48) — class 2e (intent/bookkeeping ticket, bug). The file is outside the sparse cone, so the conflict existed only in the index. Rule applied: keep the superset. The index now holds HEAD's blob (7afcdf5c55) at stage 0, and the skip-worktree bit has been restored.
  - Incoming change (7e70242688, "update bug bug-cb59cc4a"): added commit entry `working_sha: 4b2ba3eae453208637caf49fc2235a20e52498a7` (the intermediate 0.2.59 version bump), and set `updated_at` to 2026-09-03T03:24:28 and `last_field_updated` to commits.
  - HEAD's version already has that same commit entry, in the same position (between f00bf26 and 2598245). On top of it, HEAD has the later bundling update: `status: bundled`, `bundled_in: bundle-94dbe947`, `updated_at` 2026-11-01T05:18:03, `last_field_updated: status`.
  - So HEAD is a strict superset of the incoming change. HEAD's `updated_at` and `last_field_updated` are also the later values (Nov vs Sep). Taking the incoming side would have rolled `status` back to free_coded and dropped `bundled_in`.

## Incoming changes preserved

There are no code files. The one substantive incoming change, the `4b2ba3ea` commit entry, is present in the resolved version. The resolution nets to no diff vs HEAD because HEAD already contained this commit's effect (it was redundant, not discarded). Per STEP 4, the finalize step is left to handle the empty commit.
