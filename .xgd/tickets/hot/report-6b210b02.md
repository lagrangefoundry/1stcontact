---
uid: report-6b210b02
id: REPORT-7147
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:28:26.981722+00:00'
updated_at: '2026-10-31T23:28:26.981722+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` — intent/bookkeeping ticket (2e), UU (index-only, outside sparse cone). Incoming 5ee061d84e ("update request request-407a6fd8", 2026-09-02 17:02) changes only `updated_at` (00:02:06 → 00:02:11 on 2026-09-03) and `last_field_updated` (status → story_points). HEAD carries later values for both facts (updated_at 2026-10-31T20:54, last_field_updated status after the move to `bundled`) and story_points already advanced to 4. Per-fact later-state rule → kept HEAD (`checkout --ours`, `add --sparse`).

## Incoming changes preserved

No code files in conflict. The incoming commit's two field values are earlier lifecycle timestamps/markers superseded by HEAD's later state of the same ticket; the commit is redundant, not discarded. Staged diff vs HEAD is empty — finalize may skip.
