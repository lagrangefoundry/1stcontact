---
uid: report-ca104569
id: REPORT-7161
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:37:31.751250+00:00'
updated_at: '2026-10-31T23:37:31.751250+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md` — intent/bookkeeping ticket (2e), UU, outside the sparse cone (index-only conflict). Incoming commit 1c14b85 ("update request request-e53d068f"). Rule applied: **keep the superset / later fact (HEAD)**.
  - Incoming changed only frontmatter: `status: draft -> free_coding`, `last_field_updated: status`, `updated_at: 2026-09-03T00:19:08` (plus a trailing-newline change).
  - HEAD has `status: bundled` (a later lifecycle state than free_coding), `updated_at: 2026-10-31T20:54:35` (later), the same `last_field_updated: status`, plus `commits`, `version`, `bundled_in: bundle-fd009b93`, and the two extra body sections.
  - The overlapping facts (`status`, `updated_at`) are later on HEAD's side, which matches the enrichment's "more recent" rule. Resolved to stage 2 (blob 7477e62) and put back the sparse skip-worktree bit. The staged diff against HEAD is empty: the commit is redundant, and finalize should skip it.

## Incoming changes preserved

Not a code file. The incoming status transition (to free_coding) has already been overtaken on HEAD, where the request has moved further, to bundled. No incoming body content exists that isn't already in HEAD.

## Post-merge review flag

Flagged per the enrichment (intent unknown on one side). Low risk: HEAD is a strict lifecycle successor.
