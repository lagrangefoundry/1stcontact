---
uid: report-7ee597ff
id: REPORT-7711
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:27:32.617429+00:00'
updated_at: '2026-11-01T15:27:32.617429+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` — AA, intent/bookkeeping ticket (request; rule 2e, with 2b superset check). Kept HEAD (`git checkout --ours` + `git add --sparse`).
  - Incoming (7eb0dcc2d5, "create request request-95dffc48", 2026-09-04) is the ticket's original creation: status `draft`, story_points 2, initial problem statement.
  - HEAD ("update request request-95dffc48", updated_at 2026-11-01) is the same ticket after its full lifecycle: status `free_and_reconciled`, story_points 3, commits/version/bundled_in (bundle-94dbe947) populated, body rewritten to record both halves (rename to `business_id` + subject `account_id` column) as landed.
  - Every field the incoming side sets was later updated on the same ticket's own timeline; HEAD is the later per-fact state for every conflicting fact (status, updated_at, completed_at, last_field_updated, story_points, body) and a superset of the frontmatter fields. No content from incoming is lost that is not superseded by the ticket's own later revisions.

## Incoming changes preserved

No code files in this conflict. The incoming commit's intent (create request-95dffc48) is already realized in HEAD — the ticket exists, in its later state. Resolution nets to no diff vs HEAD (redundant commit, BUG-1109/BUG-1122 shape); finalize step should detect the clean staged diff and skip.

Note: branch history shows a repeating "update bundle bundle-39edf66d" / "recover uncommitted .xgd/ state from interrupted cherry-pick (BUG-603)" cycle, suggesting this same commit may have been re-attempted multiple times. If it recurs, 7eb0dcc2d5 should be recorded in the bundle's skipped_commits.
