---
uid: report-60111ba3
id: REPORT-1575
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-08-07T15:44:13.191418+00:00'
updated_at: '2026-08-07T15:44:13.191418+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: Site scaffold: CAP-89 (Site Materials & Starting Point) restates CAP-81 (Site Creation & Authoring Start Point) in full, while CAP-81 remains active and empty
**Stories resolved**: 1

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-86c7c21b (STORY-93) | confirm | capability-b4ac88fc (CAP-89) | (no change) | The story is already correctly attached to CAP-89, whose "The authoring start point" scope section restates CAP-81's entire scope. All 8 ACs (AC-869..AC-876) remain attached to STORY-93; no AC relationships were touched. |

### Capability-level resolution

The ambiguity was not in the story's placement — it was in the **capability
layer**. CAP-89 was created by the structural-rebalance step earlier in this
same run, consolidating four thin capabilities (authoring start point, site
asset store, asset provenance, colour census/palette retrofit) that "share one
subject — the site's own material inventory". STORY-93 was moved to CAP-89 as
part of that consolidation, leaving CAP-81 as an empty shell whose text is
reproduced verbatim-in-substance inside CAP-89 section "The authoring start
point".

Resolution applied:

```
xgd ticket update capability-ccac1b1d --fields \
  '{"status": "superseded", "superseded_by_uid": "capability-b4ac88fc"}'
```

This is the capability schema's designed mechanism for exactly this case:
`status` enum is `active | deprecated | superseded`, and `superseded_by_uid`
is `required_when: status == superseded`. It is also consistent with the
ticketing invariant (`core/ticketing/invariants.py`): `active` is reserved for
capabilities holding at least one non-archived story — "a capability whose only
attached stories are all completed-and-archived is legitimately retireable".
CAP-81 held none.

`superseded` (not `deprecated`) is the correct terminal state here: CAP-81's
scope was not retired, it was absorbed. The `superseded_by_uid` pointer keeps
the trail from the old capability to its new home, so anything still referring
to CAP-81 resolves forward to CAP-89.

### Verification

- `xgd ticket get capability-ccac1b1d` → `Status: superseded`,
  `superseded_by_uid: capability-b4ac88fc`. Body left intact.
- `xgd ticket get story-86c7c21b` → `capability_uid: capability-b4ac88fc`.
  Unchanged; story content untouched.
- No story in the working overlay carries
  `capability_uid: capability-ccac1b1d` — CAP-81 is confirmed empty.
- CAP-89 holds 4 stories: STORY-93, STORY-97, STORY-92, STORY-102.
- Every story in this cluster belongs to exactly one capability. Nothing was
  skipped, merged, archived, deleted or created; no AC was reassigned, so no
  `test_UAT_AC<n>_*` test renaming is required.

### Note on a duplicate listing (not a defect)

`xgd ticket list --type story --filter fields.capability_uid=<uid>` reports
STORY-93 under *both* CAP-81 (`UPDATE:2026-08-06`) and CAP-89
(`UPDATE:2026-08-07`). This is the expected canonical+overlay merge while the
run is in progress, not corruption: the canonical store in the `main` worktree
still holds the pre-rebalance copy (STORY-93 → CAP-81, and CAP-89 not yet
present), while this regression worktree's overlay holds the post-rebalance
copy. `xgd ticket get` resolves to the overlay, which is authoritative. The
canonical copy converges on merge-back. No action taken.
