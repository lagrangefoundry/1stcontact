---
uid: report-ee3d81b9
id: REPORT-4365
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:40:26.056652+00:00'
updated_at: '2026-09-19T09:40:26.056652+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — UU, intent/bookkeeping ticket (rule 2e). Same-fact conflict resolved per-fact toward HEAD (ours).

Incoming commit `232a6821` ("xgd(ticket): update bundle bundle-8eef3846", 2026-08-31 12:21:08 -0700) changed exactly three facts in the frontmatter:

- `status: ready_to_reconcile` -> `reconciling`
- `last_field_updated: created_at` -> `status`
- `updated_at` -> `2026-08-31T19:21:08.797753+00:00`

plus a trailing-newline removal on the final body line.

HEAD's side of the same region carries the SAME facts moved further forward:

- `status: free_and_reconciled` (the state past `reconciling`)
- `last_field_updated: result`, `result: pass`
- `completed_at: 2026-08-31T23:59:50`, `updated_at: 2026-09-01T00:00:07`
- `fields.orphan_commits` populated (~170 old_sha/new_sha pairs), `fields.merged_at_commit: 90527353`, `fields.commits[0].main_sha: 90527353`

Every fact in conflict is the same fact, changed differently on each side, so the 2e timeline rule applies per-fact. Both sides' intents are unknown to the enrichment, so the fallback is the more recent commit by timestamp:

- ours: `2ca3de8c` at 2026-08-31 17:00:08 -0700 (latest of five HEAD-side commits on this file after the incoming one)
- theirs: `232a6821` at 2026-08-31 12:21:08 -0700

Ours is ~4h45m later and is a strict superset in the field set — it contains no fact that incoming would have set differently, only the same lifecycle facts advanced past incoming's position. Resolved to ours; the working file now hashes to `fb4a6e5694dedd7088c066118d41dbde22c187e7`, exactly the stage-2 (ours) blob, with zero conflict markers.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a bookkeeping ticket, not source.

The incoming commit's intent is present in the resolution via a different route, not discarded. Incoming asked to move this bundle from `ready_to_reconcile` to `reconciling`; HEAD has already traversed that transition and five further commits on this file, landing on `free_and_reconciled` with `result: pass`. Re-applying incoming's hunk would move the bundle BACKWARD to an earlier lifecycle state and drop `result`, `completed_at`, `orphan_commits` and `merged_at_commit`. The trailing-newline removal from the incoming diff is also present — both sides made that identical edit, so it merged cleanly outside the conflict region.

No BUG-1301 precedence exception was invoked: no hunk was dropped on the grounds of a HEAD-side refactor, and no test function on either side was deleted.

Post-resolution `git status --porcelain` is empty, i.e. the staged tree equals HEAD and this cherry-pick nets to no diff. That is the redundant-commit case (BUG-1109/BUG-1122), distinguished from a discard by the STEP 3 check above: the incoming commit's key change IS present in HEAD (superseded forward), not absent. Per STEP 4, `--skip` was NOT called; the tree is staged and CHERRY_PICK_HEAD is left intact for `cherry_pick_finalize_resolution`.
