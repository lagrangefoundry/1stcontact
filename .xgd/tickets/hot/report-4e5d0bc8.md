---
uid: report-4e5d0bc8
id: REPORT-7643
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:41:23.147990+00:00'
updated_at: '2026-11-01T14:41:23.147990+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md` (REQ-168): intent/bookkeeping ticket (class 2e). Superset rule: kept HEAD (ours) with `git checkout --ours`, staged with `git add --sparse`.

## Incoming changes preserved

The incoming commit 8cfcafdd16 (2026-09-03T02:43, status `draft`) rewrites the ticket body. It folds the earlier "Revision" subsections into top-level sections: path prefix, no-target fallback, vocabulary, acceptance. Diffed against HEAD's body, the incoming body appears in HEAD word for word. HEAD only adds content: the later "What the implementation added, and why" section, the `commits`/`version`/`bundled_in` fields, and the later reconciled status (2026-11-01, `free_and_reconciled`, completed_at set). HEAD is therefore a strict superset. The incoming change is already integrated and redundant, not discarded, and the staged diff against HEAD is empty, so finalize should skip it. Flagged for post-merge review per the enrichment rule.
