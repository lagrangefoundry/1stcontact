---
uid: report-5b99a2b1
id: REPORT-6985
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:42:16.644408+00:00'
updated_at: '2026-10-31T21:42:16.644408+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45) — intent/bookkeeping ticket (2e; bug ticket that lives in hot). UU, resolved to HEAD (ours) via `git checkout --ours` + `git add --sparse`.
  - Frontmatter (`updated_at`, `completed_at`, `status`): the same facts were changed differently on each side. HEAD's commit 29ff990dfb (2026-10-30, `status: free_and_reconciled`, completed_at set) is later than incoming 9f43952b30 (2026-09-01, `status: ready_to_reconcile`, completed_at null). Took the later side, as the enrichment rule ("take the more recent commit by timestamp") says to.
  - Body "Not in scope": incoming has the same three bullets, only re-wrapped. HEAD has the same content plus the extra section "Superseded in part by BUG-44 (operator decision, 2026-09-01)". HEAD is a strict superset, so I kept it.

## Incoming changes preserved

No code files were involved. The incoming commit's substance (the three Not-in-scope bullets) is already in HEAD with the same wording. Its status regression to `ready_to_reconcile` is stale: HEAD already moved past it, to `free_and_reconciled`. The resolved file nets to no diff against HEAD, so this commit is redundant and finalize should skip it. Flagged for post-merge review because the enrichment rule asks for that.
