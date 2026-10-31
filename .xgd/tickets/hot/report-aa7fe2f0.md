---
uid: report-aa7fe2f0
id: REPORT-7157
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:34:58.450945+00:00'
updated_at: '2026-10-31T23:34:58.450945+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md` (2e, intent/bookkeeping ticket; UU, index-only because it is outside the sparse cone). Resolved to the HEAD (ours) blob `5cb15de514`. The skip-worktree bit was restored afterwards.
  - Both sides add the same `commits` list (4 working SHAs) and `version: 0.2.54`. That content is identical on both sides, so nothing is lost.
  - Genuine per-fact conflict on `status` / `updated_at`: HEAD has `status: bundled`, `updated_at: 2026-10-31T20:54:35` and `bundled_in: bundle-fd009b93`. Incoming has `status: free_coded`, `updated_at: 2026-09-03T00:11:53`.
  - The HEAD side is the later fact: it is newer by timestamp (this also meets the enrichment rule "take the more recent commit by timestamp") and later in the lifecycle (free_coded → bundled). Taking incoming would regress the ticket's status and drop its `bundled_in` link to the very bundle being reconciled (bundle-fd009b93).
  - Flagged for post-merge review per the enrichment rule. Low risk: HEAD is a strict superset of the incoming content apart from the stale status/timestamp.

## Incoming changes preserved

There are no code files in this conflict. Incoming commit 41af17f170 touches only this ticket. Its additions (`commits`, `version`) are already present in HEAD, and its status change to `free_coded` has been overtaken by HEAD's later `bundled` status. The resolution therefore nets to no staged diff against HEAD. This is a redundant commit, not discarded content, so finalize should skip it.
