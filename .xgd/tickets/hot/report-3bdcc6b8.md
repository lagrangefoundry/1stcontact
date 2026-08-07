---
uid: report-3bdcc6b8
id: REPORT-1577
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-08-07T15:56:11.872179+00:00'
updated_at: '2026-08-07T15:56:11.872179+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: Asset provenance: CAP-89 absorbs CAP-80 (Asset Provenance & Licence Compliance), which remains active and empty
**Stories resolved**: 1

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-8685be2d (STORY-92) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Already correctly assigned to the absorbing capability; the absorption is complete and the boundary is clean. |

### Rationale

STORY-92 ("Font provenance: every font file in the project is accounted for, and
an unresolved licence cannot ship as product") was the **only** story ever attached
to CAP-80. It is already assigned to `capability-b4ac88fc` (CAP-89, "Site Materials
& Starting Point: Scaffold, Assets, Provenance & Palette") in this refactor's ticket
store — an earlier step of this run performed the move (`last_field_updated:
capability_uid`). No reassignment was required.

The absorption is faithful, not lossy. CAP-89's `### Asset provenance & licence
compliance` scope section condenses the whole of CAP-80's scope:

- CAP-80 *Provenance record* -> CAP-89 "a project-level index over every asset file
  of a governed kind, recording origin, licence terms and the separate permissions
  those terms grant"
- CAP-80 *The two questions* -> CAP-89 "the load-bearing distinction is between
  *'may we use this on a site we run ourselves'* and *'may we ship this across ten
  thousand customer sites'*: the record carries a three-state answer to the second
  question"
- CAP-80 *Distribution marker* + *Enforcement* -> CAP-89 "plus the gates that stop
  an unanswered licence question from reaching a customer site ... every gate treats
  the unresolved state as *no*"

CAP-80's out-of-scope exclusion (binding a handle to served substance belongs to the
framework substrate) is preserved verbatim in CAP-89's own out-of-scope list
("Binding an asset handle to its served substance (pixels reaching a page)"). The
distinction CAP-80 was created to protect — provenance is about *obligations*,
binding is about *pixels* — survives the merge intact.

### AC relationships

All 12 acceptance criteria remain attached to STORY-92 and were not touched:
AC-857 ... AC-868. No AC reassignment or test renaming was required, because the
story itself did not move in this step and no merge occurred.

## Residual item: CAP-80 could not be deprecated (tooling limitation)

CAP-80 (`capability-745b9a6c`) is now empty and its scope is fully absorbed, so the
matrix-correct end state is `status=deprecated` — matching the 8 capabilities
already deprecated in this run (CAP-64, CAP-65, CAP-66, CAP-67, CAP-68, CAP-69,
CAP-72, CAP-73). **This write was attempted and rejected:**

```
Error: Cannot deprecate a capability that has attached stories. Reassign these
stories to another capability first: STORY-92.
```

The rejection is a false positive from a ticket-store split, not a real attachment:

- `xgd ticket get story-8685be2d` (worktree store) -> `capability_uid:
  capability-b4ac88fc` — correct.
- `xgd ticket get story-8685be2d --branch main` -> `capability_uid:
  capability-745b9a6c`, `updated_at: 2026-08-06` — the pre-refactor baseline.
- `xgd ticket get capability-b4ac88fc --branch main` -> **not found**. CAP-89 was
  created by this refactor and does not exist in the canonical store at all.

`invariants.count_attached_stories()` calls `ticketing.list()`, which resolves to
the canonical (main) index regardless of `--branch`; the branch worktree never
persists its own index by design. The invariant therefore cannot see any of this
run's reassignments. `xgd ticket rebuild-index` and `xgd ticket audit --run` both
refuse to run on a branch worktree (`NOT_CANONICAL`), so the stale reverse-mapping
cannot be cleared from here.

Forcing this would require writing STORY-92's `capability_uid` into the canonical
main store from a regression worktree — mutating the baseline this branch is meant
to reconcile against. That is outside this task's scope, so it was not done.

**This does not block the cluster.** The story-level resolution is complete and
correct in the refactor store. The CAP-80 deprecation should be applied when the
refactor lands on the canonical store, where the invariant will see STORY-92 on
CAP-89 and allow it. Any other capability in this run whose stories moved to a
newly-created capability will hit the same wall.
