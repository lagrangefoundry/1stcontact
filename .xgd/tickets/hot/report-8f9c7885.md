---
uid: report-8f9c7885
id: REPORT-1579
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-08-07T16:05:04.543587+00:00'
updated_at: '2026-08-07T16:05:04.543587+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: The edit render: CAP-87 (In-Page Copy Editing) absorbs CAP-84 (Edit Render Channel), which remains active and empty and is still named as owner by two sibling stories
**Stories resolved**: 2 (2 confirm, 0 reassign, 0 merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-af36c2cb (STORY-98) | confirm | capability-12fee326 (CAP-87) | (no change) | Already homed on the absorbing capability. CAP-87's body carries an explicit `### The edit render channel` scope section restating CAP-84's scope in full (channel, deliberate inertness, settled state, derived segmentation and addressing). The move was already made earlier in this run — the story carries `updated_by: bundle-15c1f647`, the CAP-87 consolidation bundle. |
| story-3bf94bd4 (STORY-101) | confirm | capability-12fee326 (CAP-87) | (no change) | The click-to-edit gesture story, native to CAP-87's `### The click-to-edit gesture` scope section. It was never a CAP-84 story; CAP-84 explicitly placed the editor UI (hover treatment, modals, click handling) out of scope. No ambiguity to resolve. |

### The cluster premise was partly stale

The survey's claim that CAP-84 is "still named as owner by two sibling stories" does
not hold against the ticket store. Both stories carry
`capability_uid: capability-12fee326`, verified directly on the ticket files, not
just via `xgd ticket get`.

The claim originates from a **stale index hit**:
`xgd ticket list --filter fields.capability_uid=capability-25f7e486` returns STORY-98,
because the canonical `main` index still holds the pre-consolidation mapping while
this regression worktree's overlay holds the post-consolidation one. `xgd ticket get`
resolves to the overlay and is authoritative. A `grep` for `capability-25f7e486`
across `.xgd/tickets` confirms the true state: the only hits are the capability's own
file, three survey reports, and the search index metadata — **no story or AC file
references CAP-84 at all**.

This is the same canonical/overlay divergence documented in the cluster 1-4 reports
from this run. It is self-correcting on merge-back once main's index rebuilds; it
cannot be fixed from here (`xgd ticket rebuild-index` refuses on a branch worktree by
design).

### What was actually resolved: the empty shell capability

The real residue is the second half of the boundary statement — CAP-84 "remains
active and empty". Zero stories, zero ACs, zero backlinks, with its entire scope
restated inside CAP-87. Left `active`, it presents a future edit-render story with
two plausible homes, which is precisely what would cause the next survey to re-flag
this cluster.

Retired it following the **cluster 1 precedent**, which is the variant verified to
work in this run:

```
capability-25f7e486 (CAP-84)
  status: active -> superseded
  superseded_by_uid: capability-12fee326
```

`superseded` was chosen over `deprecated` on two grounds:

1. **Semantics** — CAP-84's scope was not retired, it was *absorbed*.
   `superseded_by_uid` keeps the trail forward to CAP-87.
2. **It is the route that actually lands.** The ticketing invariant
   `reject_deprecation_if_capability_has_stories`
   (`core/ticketing/invariants.py`) gates **only** `status=deprecated`, and its
   `count_attached_stories()` helper reads the canonical main index — which, per the
   stale-hit above, still believes STORY-98 is attached. A `deprecated` patch would
   therefore have been refused, and refused *silently* (exit 0, no diagnostic), which
   is exactly what happened to CAP-83 in cluster 4: that capability still sits at
   `status: active` carrying only a `merged_into` field. `superseded` is not gated by
   that invariant, matching the schema
   (`ticket_types.yaml:286` — `enum: [active, deprecated, superseded]`, with
   `superseded_by_uid` `required_when: status == superseded`).

The write was **verified to have persisted** by re-reading the ticket file, rather
than trusting the command's exit status — given the silent-refusal failure mode above,
a success message alone is not evidence.

### Integrity

- 2 stories before, 2 after. No story content edited, none archived, none created.
- Both stories belong to exactly one capability. Neither was skipped.
- 27 ACs before and after: 13 on STORY-98 (AC-948..AC-958, AC-1007, AC-1008),
  14 on STORY-101 (AC-993..AC-1006). No AC changed story.
- No merges and no AC reassignment, therefore **no `test_UAT_AC<N>_*` renaming was
  required** — the AC numbering behind every existing test name is untouched.

### Note for the operator

`xgd ticket audit` will continue to report CAP-84 as an active capability until the
canonical index is rebuilt from `xgd-working`. The ticket file is correct; the index
is not. Same caveat as clusters 1-4.
