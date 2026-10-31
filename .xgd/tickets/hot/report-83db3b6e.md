---
uid: report-83db3b6e
id: REPORT-6989
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:44:38.835028+00:00'
updated_at: '2026-10-31T21:44:38.835028+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158). File class: intent/bookkeeping request ticket (2e), UU, sparse (index-only). Only the frontmatter `updated_at` / `status` facts conflicted. HEAD (seed_local_overlay) had `updated_at: 2026-09-09T21:32:50Z`, `status: bundled`. Incoming 625e291b9e ("update request request-6893f6ea", 2026-09-02) had `updated_at: 2026-09-02T01:52:32Z`, `status: ready_to_reconcile`. Rule: same fact changed differently, so I took the more recent side by timestamp, per the enrichment rule. HEAD is a week newer and `bundled` is the later lifecycle state, so I kept HEAD (`git checkout --ours`, `git add --sparse`). Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

Not a code file. The incoming commit's only change was the older status transition (ready_to_reconcile), which HEAD has already moved past (bundled). Its effect is superseded rather than discarded. The staged result has no diff from HEAD, so finalize should skip the commit as redundant.
