---
uid: report-f108ee31
id: REPORT-6967
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:30:20.724120+00:00'
updated_at: '2026-10-31T21:30:20.724120+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e). The rule is to take the side with the later commit timestamp, applied per fact. HEAD (ours) kept.
  - Frontmatter: incoming (9223fddb42, 2026-09-02T00:29) set `status: free_coding`, `completed_at: null` and `updated_at` 2026-09-02. HEAD has the later state: `status: free_and_reconciled`, completed 2026-10-30T21:51, `updated_at` 2026-10-30. HEAD is newer, so HEAD kept.
  - "Not in scope" section: incoming carries an earlier, shorter wrapped version (two bullets). HEAD contains the same n-gram and classification items, plus the `role`/`republishable` search-hit item. It also has the "Superseded in part by BUG-44" section recording the 2026-09-01 operator decision. HEAD covers all of incoming's content and is newer, so HEAD kept.
  - Staged with `git checkout --ours` then `git add --sparse` (the path is outside the sparse cone).

## Incoming changes preserved

Not a code file. The incoming commit is a stale ticket-metadata snapshot (2026-09-02) that the ticket's later lifecycle (reconciled 2026-10-30) has superseded. Applying it would roll the status back from free_and_reconciled to free_coding and drop the BUG-44 supersession record. The resolved file is identical to HEAD, so the staged diff is empty. The finalize step is expected to skip this commit as redundant.
