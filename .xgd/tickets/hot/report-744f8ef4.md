---
uid: report-744f8ef4
id: REPORT-8238
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:51:05.592418+00:00'
updated_at: '2026-11-02T01:51:05.592418+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-ddd47be3.md` — intent/bookkeeping ticket (2e; outside sparse cone, index-only conflict). Resolved to OURS (HEAD) via `git checkout --ours` + `git add --sparse`.
  - Incoming e01f2181a6 (2026-09-06T19:44:17): body rewrite (reflow of the request body), `last_field_updated: body`.
  - HEAD's body is byte-identical to the incoming body — the incoming edit is already present (redundant commit).
  - Remaining differences are frontmatter only: HEAD has `status: bundled`, `bundled_in: bundle-5052a63c`, `updated_at` 2026-11-01 vs incoming `status: ready_to_reconcile`, `updated_at` 2026-09-06. HEAD is the strict superset / later lifecycle state; per the enrichment rule (more recent by timestamp) HEAD wins. Flagged for post-merge review per the enrichment rule.
  - Net staged diff vs HEAD: none — finalize step should detect clean diff and skip.

## Incoming changes preserved

No code files involved. The incoming commit's body change is present verbatim in HEAD; its older status/updated_at values are superseded by HEAD's later `bundled` state.
