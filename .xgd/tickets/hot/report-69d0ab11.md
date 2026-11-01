---
uid: report-69d0ab11
id: REPORT-7709
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:26:20.110022+00:00'
updated_at: '2026-11-01T15:26:20.110022+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). Class: intent/bookkeeping ticket (2e). Rule: keep the strict superset, so HEAD/ours was kept.
  - Body: the incoming side (2b1d448186, status draft, v0.2.61, updated 2026-09-04) ends with the "Reopened 2026-09-04" section. HEAD has that whole section word for word, plus the later "Implementation delta" and "Acceptance, in test terms" sections.
  - Frontmatter: HEAD is newer on every field: status free_and_reconciled, v0.2.69, updated 2026-11-01, story_points 4, a second commit entry, depends_on REQ-178, bundled_in. Every field on the incoming side is also on HEAD.
  - The ticket is outside the sparse cone, so the conflict was resolved in the index only: stage 2 (blob 29f17cd5) was written to the index, and the skip-worktree bit was restored afterwards.

## Incoming changes preserved

No code files were involved. Everything the incoming commit added to the ticket (the DOC-42 reopen amendment) is already in HEAD, so the commit is redundant (BUG-1109/BUG-1122 shape) rather than discarded. The staged diff against HEAD is empty, and finalize is expected to skip this commit.
