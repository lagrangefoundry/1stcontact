---
uid: report-8400d2f5
id: REPORT-7291
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:37:27.480400+00:00'
updated_at: '2026-11-01T05:37:27.480400+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-bfd833d0.md` — class 2e (intent/bookkeeping ticket, request). Conflict was confined to frontmatter `updated_at` / `completed_at` / `last_field_updated` / `status` (same facts changed on both sides). Applied per-fact later-wins rule: kept HEAD (ours), resolved via `git checkout --ours` + `git add --sparse` (path outside sparse cone).
  - Incoming 3f8f22b75b (2026-09-02T22:30Z): status draft -> free_coding, completed_at null.
  - HEAD 57fc6f11d9 (2026-10-30T21:51Z): status free_and_reconciled, completed_at 2026-10-30T21:51:43Z.
  - HEAD's state is a later lifecycle position that already subsumes the incoming free_coding transition; applying incoming would regress the ticket's status. No other hunks/fields differed.

## Incoming changes preserved

No code files involved. The incoming commit's only effect (advancing request-bfd833d0 out of draft) is already superseded on HEAD by the later free_and_reconciled status, so the commit is redundant on this branch. Resolution stages to no net diff vs HEAD; left for cherry_pick_finalize_resolution to skip (cherry-pick not continued/skipped by resolver).

Flagged for post-merge review per enrichment rule (intent unknown on both sides; took more recent by timestamp).
