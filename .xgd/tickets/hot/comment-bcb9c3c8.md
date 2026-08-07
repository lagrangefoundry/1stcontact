---
uid: comment-bcb9c3c8
id: COMMENT-756
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T15:56:34.254908+00:00'
updated_at: '2026-08-07T15:56:34.254908+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3bdcc6b8
  kind: note
---

Cluster 3 resolved. Report `REPORT-1577` (`report-3bdcc6b8`) created with `cluster_id: "3"`, `report_kind: overlap_resolution`, `subject_uid: report-17a279f7`, result `pass`.

## Resolution

**STORY-92 (`story-8685be2d`) — confirm, no change.**

It was the only story ever attached to CAP-80, and it is already assigned to `capability-b4ac88fc` (CAP-89) in this refactor's ticket store — an earlier step of the run made the move (`last_field_updated: capability_uid`). All 12 ACs (AC-857…AC-868) remain attached and untouched; no merge, no AC reassignment, no test renaming needed.

The absorption is faithful. CAP-89's `### Asset provenance & licence compliance` section carries over each of CAP-80's scope parts — provenance record, the two questions with the three-state redistribution answer, the distribution marker and the gates that treat "unresolved" as *no*. CAP-80's load-bearing exclusion (binding a handle to served substance is framework substrate, not provenance) survives verbatim in CAP-89's own out-of-scope list.

## One thing I could not complete

CAP-80 is now empty and should be `deprecated`, matching the 8 capabilities already deprecated in this run. **I attempted the write and it was rejected:**

```
Cannot deprecate a capability that has attached stories. Reassign these
stories to another capability first: STORY-92.
```

That is a false positive from a ticket-store split, not a real attachment:

- `xgd ticket get story-8685be2d` → `capability-b4ac88fc` ✓ (worktree store)
- `... --branch main` → `capability-745b9a6c`, updated 2026-08-06 (pre-refactor baseline)
- `xgd ticket get capability-b4ac88fc --branch main` → **not found** — CAP-89 exists only in this worktree

`invariants.count_attached_stories()` goes through `ticketing.list()`, which resolves to the canonical main index regardless of `--branch`; branch worktrees never persist their own index by design. So the invariant is structurally blind to every reassignment this run has made. `xgd ticket rebuild-index` and `xgd ticket audit --run` both refuse on a branch worktree (`NOT_CANONICAL`), so the stale mapping can't be cleared from here either.

Forcing it would mean writing STORY-92's `capability_uid` into the canonical main store from a regression worktree — mutating the baseline this branch reconciles against. I left that alone as out of scope.

Worth flagging for the outer run: **any capability whose stories moved to a newly-created capability will hit this same wall.** The deprecations should go through once the refactor lands on the canonical store.
