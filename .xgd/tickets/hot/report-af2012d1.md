---
uid: report-af2012d1
id: REPORT-8017
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:31:30.293663+00:00'
updated_at: '2026-11-02T00:31:30.293663+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` — intent/bookkeeping ticket (2e), UU on front-matter only (`updated_at`, `completed_at`, `status`). Same fields changed differently on each side; per-fact resolution: kept HEAD (ours). Staged with `git add --sparse` (outside sparse cone).

Fact comparison:
- Incoming 9545d0b50d (2026-09-05T18:58:40Z): status `free_coded` -> `ready_to_reconcile`, completed_at null.
- HEAD (2026-11-01T22:57:24Z): status `free_and_reconciled`, completed_at 2026-11-01T22:57:19Z.
HEAD is the later state on the same lifecycle (ready_to_reconcile precedes free_and_reconciled); applying incoming would regress a completed ticket. Matches the enrichment rule "take the more recent commit by timestamp". Flagged for post-merge review per that rule.

## Incoming changes preserved

No code files involved. The incoming commit's only change (a status transition to ready_to_reconcile) is superseded by HEAD's later terminal status — the commit is redundant on this branch, not discarded. Staged diff vs HEAD is empty; finalize step should skip the commit.
