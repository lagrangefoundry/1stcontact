---
uid: report-a474572a
id: REPORT-7039
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:14:43.074684+00:00'
updated_at: '2026-10-31T22:14:43.074684+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` (BUG-47). File class: intent/bookkeeping ticket (2e). Rule: superset / per-fact later state, so I kept HEAD (ours). The file is outside the sparse cone, so I resolved it with `git checkout --ours` and `git add --sparse`.

## Incoming changes preserved

The incoming commit 33f97305cf (2026-09-02 14:12) appended the body sections "What was implemented" and "Test plan". HEAD already contains both sections word for word, so they are preserved. Its frontmatter values (`updated_at` 2026-09-02T21:12, `last_field_updated: body`, `status: free_coding`, `completed_at: null`) were later replaced in HEAD by the reconciled state: `status: free_and_reconciled`, `updated_at`/`completed_at` 2026-10-30, plus `commits`/`version`/`bundled_in`. The only remaining difference is the trailing newline at EOF, which has no effect on meaning. The commit is redundant, and the staged diff against HEAD is empty, so finalize is expected to skip it (per BUG-1109/BUG-1122).

Untouched: the unstaged edits to `.xgd/_changes/*` and the untracked `report-98659d4c.md`.
