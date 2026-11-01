---
uid: report-26c90b1e
id: REPORT-7655
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:50:33.854489+00:00'
updated_at: '2026-11-01T14:50:33.854489+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48), UU, intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset. Took OURS (HEAD) via `git checkout --ours` + `git add --sparse` (outside the sparse cone).

  The incoming commit 7e70242688 only adds the commit entry `working_sha: 4b2ba3eae453208637caf49fc2235a20e52498a7` to `fields.commits`, between f00bf269 and 25982452, and bumps `updated_at` / `last_field_updated: commits`. HEAD already has that same entry in the same position, now with `reconcile_sha: 20683ab0cfd2224192122b9afe707e0b946c39da`, and it also carries later state: `status: free_and_reconciled`, `completed_at`, reconcile_shas on every commit, `working_sha_history`, and `version: 0.2.60`. Taking THEIRS would have put the ticket back to `free_coded` with null reconcile_shas.

## Incoming changes preserved

- The incoming commit's only substantive change (the 4b2ba3ea commit entry) is already in HEAD. This commit is redundant, not discarded. The resolution has no staged diff against HEAD, so finalize is expected to skip it as empty (BUG-1109/BUG-1122 shape). No code files were involved.
