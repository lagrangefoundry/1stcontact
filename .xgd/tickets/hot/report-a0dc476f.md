---
uid: report-a0dc476f
id: REPORT-7151
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:30:35.121596+00:00'
updated_at: '2026-10-31T23:30:35.121596+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md` (REQ-166): an intent/bookkeeping ticket (rule 2e). Kept the HEAD side because it is a strict superset of the incoming side.
  - The incoming commit 92bae07833 ("update request request-20bd7d63", 2026-09-02) appended the "Corrections found while building this", "Also true of the finished work" and final Acceptance sections. HEAD already has those sections byte-for-byte; the only body difference is a trailing newline at EOF.
  - In the frontmatter, HEAD is newer (updated_at 2026-10-31, status `bundled`, `commits` list, `version: 0.2.54`, `bundled_in: bundle-fd009b93`). Incoming has the older `status: free_coding`, `updated_at` 2026-09-03 and `last_field_updated: body`. Taking the incoming side would have pulled the ticket back out of the bundle.
  - The path is outside the sparse-checkout cone. Stage 2 (ours, blob 5cb15de5) was set directly in the index with skip-worktree restored.

## Incoming changes preserved

- The incoming commit's only content change (the appended body sections) is already present in HEAD. The commit is redundant on this branch, and the resolution stages to no diff against HEAD. Nothing from the developer's edit was discarded.

No arbitration of last resort (STEP 3h) was needed.
