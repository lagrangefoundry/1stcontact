---
uid: report-f365a8be
id: REPORT-6699
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:02:59.003701+00:00'
updated_at: '2026-10-25T23:02:59.003701+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` (BUG-44): intent/bookkeeping ticket (2e), UU, only in the index (outside the sparse cone). Rule: one side is a strict superset, so keep the superset (ours / HEAD, blob e243d4b1ca). Staged at stage 0 with skip-worktree set.

## Incoming changes preserved

- The incoming commit 0b1db72ad0 ("xgd(ticket): update bug bug-5bc83942", 2026-09-02T01:53) made one change: a body edit that replaces the "BLOCKED — this ticket's conclusion collides with BUG-45" section with "Decision: remove the registry", "Behaviour required" and "Test plan". `git diff` of the stage-2 and stage-3 blobs shows the body is byte-identical on both sides, apart from the incoming side's trailing newline. So the incoming change is already present in HEAD.
- The two sides differ only in frontmatter. Ours is newer (updated_at 2026-10-25, status: bundled, bundled_in: bundle-5607a08d, version 0.2.42, commits entry). Theirs is the older draft state (updated_at 2026-09-02). Taking theirs would revert the bundling, so ours was kept.
- Net staged diff vs HEAD is empty. The commit is redundant, not discarded: its effect already landed in HEAD. Finalize is expected to detect the empty diff and skip it.
