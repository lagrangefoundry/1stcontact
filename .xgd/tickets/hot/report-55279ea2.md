---
uid: report-55279ea2
id: REPORT-7671
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:00:43.867275+00:00'
updated_at: '2026-11-01T15:00:43.867275+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` — intent/bookkeeping ticket (2e), UU (index-only, outside sparse cone). Rule: HEAD is a strict superset → keep superset. Resolved to HEAD (`git checkout --ours`, `git add --sparse`).

## Incoming changes preserved

Incoming commit 7163710afe (2026-09-03) (a) bumped header `updated_at`/`last_field_updated: body` while at `status: free_coding`, and (b) appended the "Implementation scope (added at free-coding time)" section (GET /api/businesses endpoint, /b/<id> prefixing, toolbar site selector removal, shell-bar mount, acceptance-in-test-terms). HEAD already contains that entire section verbatim in content (only line-wrapping differs — HEAD has paragraphs reflowed to single lines; verified key phrases present in HEAD), followed by the later "Reopened 2026-09-04" amendment and its Implementation delta, which incoming lacks. Header: HEAD holds the later lifecycle state (`status: free_and_reconciled`, completed 2026-11-01). Taking incoming would delete the reopen amendment and regress status. The commit is redundant (BUG-1109/BUG-1122 shape); staged diff vs HEAD is empty, so finalize should skip it. No code files involved.
