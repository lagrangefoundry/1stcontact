---
uid: report-4c23404f
id: REPORT-7117
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:07:27.747402+00:00'
updated_at: '2026-10-31T23:07:27.747402+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md` (REQ-177): intent/bookkeeping ticket (rule 2e). Kept HEAD (`git checkout --ours`, then `git add --sparse`; the path is outside the sparse cone).
  - The only conflicting hunk was the frontmatter fields `updated_at`, `completed_at` and `status`.
  - Incoming (36b72fc0c7, 2026-09-02T23:38): `status: draft -> free_coding`, `completed_at: null`.
  - HEAD (updated 2026-10-30T21:51): `status: free_and_reconciled`, `completed_at: 2026-10-30T21:51:39`.
  - The two sides set the same field differently. HEAD's change is later by timestamp (the enrichment's "more recent commit" rule) and further along the lifecycle. The incoming `free_coding` is an intermediate state the ticket has already passed through. HEAD also already contains the full "What landed" body and commit record, so nothing else from the incoming side is missing.

## Incoming changes preserved

- No code files were involved. The incoming commit changes only frontmatter status bookkeeping (3 lines), and HEAD supersedes it. This is a redundant pick: staging nets to no diff vs HEAD, so finalize can skip the commit. Flagged for post-merge review per the enrichment rule, though low risk.
