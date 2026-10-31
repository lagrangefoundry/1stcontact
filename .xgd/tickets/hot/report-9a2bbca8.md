---
uid: report-9a2bbca8
id: REPORT-6947
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:18:22.056196+00:00'
updated_at: '2026-10-31T21:18:22.056196+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` (UU, outside sparse cone, index-only) — file class 2e (intent/bookkeeping ticket: bug). Rule applied: "one side is a strict superset" → kept HEAD (stage 2, blob cd14a125).
  - Base→incoming (eb9960199f, updated_at 2026-09-01T22:36:06): status draft→free_coded, last_field_updated→status, added `commits` entry (working_sha 84cc117a) and `version: 0.2.40`; plus dropped trailing newline.
  - Base→HEAD (updated_at 2026-09-19T15:15:28): the identical changes PLUS later progress: status→free_and_reconciled, completed_at 2026-09-14T10:29:01, `bundled_in: bundle-8e1807f6`.
  - HEAD is a strict superset and the more recent timestamp (also satisfies the enrichment's "take the more recent commit" rule). Taking incoming would regress the ticket's lifecycle status.
  - Staged via `git update-index --cacheinfo` with HEAD's blob; skip-worktree bit restored so the sparse checkout stays consistent.

## Incoming changes preserved

No code files involved. Every substantive incoming change (free_coded status transition, commits entry, version) is already present in HEAD and superseded by later state; only the missing-trailing-newline difference was dropped. The resolution nets to no staged diff vs HEAD — the incoming commit is redundant on this branch (BUG-1109/BUG-1122 shape), not discarded. Left for cherry_pick_finalize_resolution to skip.

Flag for post-merge review per enrichment rule (intent unknown on both sides), though no information was lost.
