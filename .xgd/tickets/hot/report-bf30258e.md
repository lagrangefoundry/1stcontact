---
uid: report-bf30258e
id: REPORT-7381
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:27:05.019170+00:00'
updated_at: '2026-11-01T06:27:05.019170+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md` (REQ-166): an intent/bookkeeping ticket (2e), conflict class UU. The two sides changed different parts of the file, so both were applied (2e):
  - **Ours (HEAD, reconcile):** the reconcile header fields: `status: free_and_reconciled`, `completed_at: 2026-11-01T05:03:18`, `updated_at: 2026-11-01T05:03:20`, `last_field_updated: status`, and the `fields.commits` list (4 entries). These are the later header state, so they were kept.
  - **Theirs (incoming 92bae07833):** the body addition only: the "Corrections found while building this" and "Also true of the finished work" sections and the final Acceptance list. It also changed `updated_at`/`last_field_updated: body`, but HEAD's later values replace those.
  - Built from stage 2 (ours) with stage 3's appended body added at the end. I checked it with `git diff :3:<path> -- <path>`: the body matches theirs exactly, and the only differences are the header fields listed above.
  - Staged with `git add --sparse`, because the path is outside the sparse cone.

## Incoming changes preserved

No code files were in conflict. The incoming commit's only real change is the appended body text, and it is all in the resolved file. Nothing was dropped under BUG-1301.

## Post-merge review flag

Enrichment marked the intent as unknown on both sides. This is flagged for review, but the edits are disjoint (header fields vs. appended body), so no fact was settled by a timeline tiebreak.
