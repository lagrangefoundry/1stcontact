---
uid: report-dca54c15
id: REPORT-7673
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:02:29.092273+00:00'
updated_at: '2026-11-01T15:02:29.092273+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-da60b61b.md` (REQ-169), intent/bookkeeping ticket (2e). Only the frontmatter status block conflicted (`updated_at`, `completed_at`, `status`). Rule: same fact changed differently on each side, so the later side wins per fact. The enrichment also says to take the more recent commit by timestamp. HEAD (7ca0cc016d, 2026-11-01): `status: free_and_reconciled`, `completed_at: 2026-11-01T13:58:39`. Incoming (2e6e671a31, 2026-09-03): `status: free_coding`, `completed_at: null`. Kept HEAD. Staged with `git add --sparse` because the file is outside the sparse cone.

## Incoming changes preserved

No code files were involved. The incoming commit only changed the ticket's status fields, moving it back to `free_coding`. HEAD already has a later state for REQ-169: it was coded, bundled in bundle-94dbe947, and reconciled, and HEAD has the full "What was built" and test plan sections. So the incoming change is stale and fully superseded. The resolution stages to no diff vs HEAD; this is a redundant commit, not discarded developer work. Flagged for post-merge review as the enrichment rule requires.
