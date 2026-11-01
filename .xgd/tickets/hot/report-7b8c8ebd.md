---
uid: report-7b8c8ebd
id: REPORT-7305
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:44:46.986855+00:00'
updated_at: '2026-11-01T05:44:46.986855+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-43ce519b.md` (REQ-174), class 2e (intent/bookkeeping ticket). Rule: same facts changed differently on each side, so the later-positioned state wins, applied per fact. Resolved with `git checkout --ours` + `git add --sparse`, because the file is outside the sparse cone.
  - Conflict was limited to frontmatter `updated_at` / `completed_at` / `last_field_updated` / `status`. Body and `fields` are identical on both sides.
  - Incoming (7495d29c10, 2026-09-02): the `draft -> free_coding` transition, `updated_at 2026-09-02T22:43:20`, `completed_at: null`.
  - HEAD: `status: free_and_reconciled`, `updated_at 2026-10-30T21:51:52`, `completed_at 2026-10-30T21:51:42`. This is the later lifecycle state and already includes the incoming transition (the ticket went through free_coding to reach free_and_reconciled).
  - Kept HEAD on every conflicting fact. Taking incoming would move a completed ticket back to free_coding.

## Incoming changes preserved

There are no code files in this conflict. The only effect of the incoming commit is an earlier status transition, which HEAD's later state already supersedes. The commit is redundant, not discarded, so the staged diff against HEAD is empty. The finalize step should detect the empty diff and skip the commit, per STEP 4.
