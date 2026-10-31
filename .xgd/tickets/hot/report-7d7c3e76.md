---
uid: report-7d7c3e76
id: REPORT-7021
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:05:09.351636+00:00'
updated_at: '2026-10-31T22:05:09.351636+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-2bd9d184.md` (REQ-175). Class: AA, intent/bookkeeping ticket (2b/2e). Rule: superset / later-intent per fact. **Kept ours (HEAD).**
  - Incoming (5958736229, "create request request-2bd9d184") is the original draft from 2026-09-02: status `draft`, no commits, no bundle link.
  - Ours is the same ticket after later edits (updated_at 2026-10-31): status `bundled`, `bundled_in: bundle-fd009b93`, commit list, version 0.2.50, and the full "Decisions (agreed with the operator)" section D1–D6.
  - Ours contains all of the incoming body. The only fact that differs is the related-ticket link: `[[REQ-176]]` (incoming) vs `[[BUG-48]]` (ours). Ours is the later edit, so ours was kept for that fact too.
  - Resolved with `git checkout --ours` + `git add --sparse`; the file is outside the sparse cone.

## Incoming changes preserved

No code files were involved. The incoming commit only creates the ticket, and HEAD already has that ticket in a later, superset form. The commit is therefore redundant on this branch (BUG-1109/BUG-1122 shape), not discarded, and the resolution nets to no diff vs HEAD. Left for cherry_pick_finalize_resolution to handle.

Flagged for post-merge review per the enrichment's "intent unknown" rule. Low risk: ours is a strict content superset apart from the REQ-176→BUG-48 link, where ours is the later edit.
