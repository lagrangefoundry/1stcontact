---
uid: report-19a09c1e
id: REPORT-7943
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:08:22.134784+00:00'
updated_at: '2026-11-02T00:08:22.134784+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md`: intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep it. Resolved to HEAD (`git checkout --ours` + `git add --sparse`).
  - Incoming c1911a0658 (2026-09-04, "Content edit, append-only") appends the "What was implemented, including consequences of the above" section and bumps updated_at, keeping status `draft`.
  - HEAD already contains that whole appended section verbatim (`diff` of the two blobs shows no body differences except a trailing newline at EOF). HEAD is also later on every changed fact: `status: free_and_reconciled`, `completed_at` 2026-11-01, `updated_at` 2026-11-01, plus `commits` (working_sha 5b6befd1...), `version: 0.2.71` and `bundled_in: bundle-39edf66d` fields that the incoming side lacks.
  - The second conflict hunk differed only by the missing newline at end of file.

## Incoming changes preserved

The incoming commit's only content change (the appended implementation section) is present in HEAD and so in the resolution. Its frontmatter values (`updated_at` 2026-09-05, `status: draft`) are older than HEAD's and are superseded by them. The staged diff vs HEAD is empty: the commit is redundant (already landed through an earlier route), not discarded. Left for finalize to skip.

No BUG-1301 drops. STEP 3h not used.
