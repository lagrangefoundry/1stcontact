---
uid: report-b96e4c09
id: REPORT-7948
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:09:23.966336+00:00'
updated_at: '2026-11-02T00:09:23.966336+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md`: intent/bookkeeping ticket (2e). Resolved to HEAD (`git checkout --ours` + `git add --sparse`).
  - Incoming ba689ae648 (2026-09-04 19:18) only advances `status: draft -> free_coding`, sets `last_field_updated: status` and bumps `updated_at` to 2026-09-05. The commit message says it backfills the skipped FREE-CODING.md step 2 transition.
  - HEAD is later on every one of those facts: `status: free_and_reconciled` (further along the draft -> free_coding -> free_coded -> reconciled lifecycle), `last_field_updated: status`, and `updated_at`/`completed_at` of 2026-11-01. HEAD also carries the `commits`, `version: 0.2.71` and `bundled_in: bundle-39edf66d` fields, which the incoming side lacks.
  - Applying the incoming status would regress the ticket to an earlier lifecycle state. The remaining hunk differs only by the trailing newline at EOF.

## Incoming changes preserved

The incoming commit's intent (the ticket passing through `free_coding`) is already satisfied: HEAD's state lies past it in the lifecycle. The staged diff vs HEAD is empty: the commit is redundant, not discarded. Left for finalize to skip. No BUG-1301 drops. STEP 3h not used.
