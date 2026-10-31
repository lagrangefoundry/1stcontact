---
uid: report-6ec23e2e
id: REPORT-7171
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:50:01.362897+00:00'
updated_at: '2026-10-31T23:50:01.362897+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md`: intent/bookkeeping ticket (2e), UU conflict. It is outside the sparse cone, so the conflict existed only in the index. Rule applied: keep the superset. I took OURS (HEAD, blob 7477e6299e) and kept the skip-worktree bit set.
  - Base: `status: free_coding`, `updated_at` 2026-09-03T01:34.
  - Incoming (f2ac69fb41): `status: free_coded`, adds `fields.commits` (working SHAs 0504c113, af50fe67) and `version: 0.2.56`, `updated_at` 2026-09-03T01:38.
  - HEAD: everything incoming adds (same `commits` and `version`), plus the later status `bundled`, `bundled_in: bundle-fd009b93`, and `updated_at` 2026-10-31T20:54.
  - The only fields that differ (`status`, `updated_at`) are a lifecycle advance on HEAD (`free_coded` -> `bundled`) and a later timestamp, so HEAD is the strict superset and also the more recent version. This also matches the enrichment's rule to take the more recent side.

## Incoming changes preserved

- No code files were involved.
- Every fact the incoming commit adds is in the resolved version: the `commits` list and `version: 0.2.56`. Its `status: free_coded` was superseded by HEAD's later `bundled`.
- The resolution makes no change against HEAD. The commit is redundant here, not discarded, so finalize should detect the clean staged diff and skip it.

## Post-merge review flag

- The enrichment flagged this file because the intent on one side was unknown. On inspection the result is a clean superset, so no further review is expected.
