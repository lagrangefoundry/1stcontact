---
uid: report-cfd25bb3
id: REPORT-7729
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:39:04.166586+00:00'
updated_at: '2026-11-01T15:39:04.166586+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184): intent/bookkeeping ticket (2e). Conflict was index-only (outside the sparse cone). Kept HEAD's version (`git checkout --ours` + `git add --sparse`).
  - Conflicting facts were `updated_at`, `completed_at`, `status` and `fields.bundled_in`.
  - HEAD has `status: free_and_reconciled`, completed and updated 2026-11-01T13:58, and `bundled_in: bundle-94dbe947`.
  - Incoming b9d13f55 (authored 2026-09-04) has `status: free_coded`, `completed_at: null`, and no `bundled_in`.
  - Applied the enrichment rule ("take the more recent commit by timestamp"): HEAD's 2026-11-01 state is two months newer. It is also a strict superset: it advances the status past free_coded and adds `bundled_in`. Taking the incoming side would regress a completed, reconciled request back to free_coded.
  - Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

Not a code file. The incoming commit's only change was moving the status to `free_coded`. HEAD has already moved past that (free_coded -> free_and_reconciled), so the incoming effect is already included and superseded. The resolution nets to no diff vs HEAD (a redundant commit, not a discarded one). No BUG-1301 exception applied.

## Note

Recent history repeatedly alternates "update bundle bundle-39edf66d" and "recover uncommitted .xgd/ state from interrupted cherry-pick (BUG-603)". This suggests this pick has been retried many times. The finalize step should treat it as an empty commit and skip it.
