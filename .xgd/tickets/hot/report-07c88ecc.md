---
uid: report-07c88ecc
id: REPORT-7417
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:49:17.400585+00:00'
updated_at: '2026-11-01T06:49:17.400585+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md` (REQ-173): intent/bookkeeping ticket (class 2e), UU, index-only (outside the sparse cone). Resolved to OURS with `git checkout --ours` + `git add --sparse`.
  - Bodies on both sides are byte-identical; only frontmatter conflicted.
  - Ours (HEAD): status `free_and_reconciled`, updated_at 2026-11-01T05:03:20, completed_at set, commits[1].reconcile_sha e8fd80ec..., working_sha_history, bundled_in bundle-fd009b93.
  - Theirs (62aafcb115): earlier transition `free_coded` -> `ready_to_reconcile`, updated_at 2026-09-03T02:34:26, no reconcile/bundle data.
  - Rule: same fields (status/updated_at) changed differently -> take the later side per fact; per enrichment rule, more recent by timestamp. HEAD is later and is a lifecycle superset of theirs (ready_to_reconcile is a predecessor of free_and_reconciled). Taking theirs would regress status and drop reconcile_sha/bundled_in.
  - Flagged for post-merge review per enrichment rule (intent unknown on one side).

## Incoming changes preserved

No code files were in conflict. The incoming commit's only change (status transition to ready_to_reconcile) is already superseded in HEAD. The staged diff vs HEAD is empty: a redundant commit, not a discard. Leave it to finalize to skip the empty commit.
