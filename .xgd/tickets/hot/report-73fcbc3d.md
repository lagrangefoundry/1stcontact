---
uid: report-73fcbc3d
id: REPORT-1716
type: report
title: 'Overlap resolution: cluster 7'
created_by: xgd
created_at: '2026-08-09T01:36:56.628456+00:00'
updated_at: '2026-08-09T01:36:56.628456+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '7'
---

## Cluster 7 Resolution

**Boundary**: The behavior-module contract accretes required members specified by its consumers
**Stories resolved**: 4 (4 confirm, 0 reassign, 0 merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-179b8c06 (STORY-85) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the behavior-module contract itself. CAP-72 "Behavior Module Contract & Catalog" is deprecated with `merged_into: capability-ae9d65d6`, so CAP-70 is the contract's post-merge home. Every consumer-specified obligation that constrains what a module *ships* is asserted here (AC-809), not in the consumer. |
| story-af36c2cb (STORY-98) | confirm | capability-12fee326 (CAP-87) | (no change) | The edit render channel. CAP-84 is superseded by CAP-87, which consolidates the render and the gesture — correct home. Its criteria are all observable on rendered output; none asserts what a module may ship. |
| story-37a3921b (STORY-100) | confirm | capability-f753cecd (CAP-86) | (no change) | The validated atomic write path, and the sole story in CAP-86. Its module-touching criterion (AC-989) asserts address resolution and read/write behaviour through the surface, not a member of the module contract. |
| story-46e3b3c7 (STORY-82) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Reproduction-treatment supersession record. Its original home CAP-69 is deprecated with `merged_into: capability-ae9d65d6`, and both surfaces its body redirects to (L1 leaf axes; the behavior contract) now live in CAP-70 — so there is no other capability it could belong to. Residual duplication recorded below. |

### Why the overlap is acceptable, criterion by criterion

The cluster names a real pattern: two consumer capabilities place obligations on
the behavior-module contract owned by a third. Both instances are already
resolved along an ownership seam, and the resolution is recorded on both sides.

**1. The settled (behaviour-off) state — resolved by escalation into the contract.**
This one genuinely conflicted: STORY-85/AC-809 asserted "a behavior module ships
no CSS beyond its declared invariant elements" while the carousel had to ship an
edit-scoped rule to release its scroll track. The matrix briefly held a
proposition and its negation. It was resolved before this pass by giving the
contract a **second declared carve-out** — bounded to the edit channel by a
document-level marker, and to release-not-paint properties. AC-809 (STORY-85)
now states what a module is *permitted to ship*; AC-950 (STORY-98) states what
the *channel* observes (both slides visible; the rule inert in preview). Neither
restates the other, and both story bodies carry the placement note explaining the
split. Nothing to move.

**2. The seam marker — a consumer requirement with no contract conflict.**
AC-954 (STORY-98) requires every catalog module exposing a presentation seam to
mark it, and verifies this for-each-module-in-catalog. That is an obligation on
the contract asserted from a consumer, and it has no counterpart AC in STORY-85
(no STORY-85 criterion mentions a seam). This was checked and is **not** the
same situation as the settled state: the marker is inert structural markup
carrying no behaviour and no styling, so it contradicts no contract criterion —
there is no proposition/negation pair to reconcile. The channel requires that a
seam be identifiable; the module is what identifies it; the requirement is
observable in the channel's own output, which is where it is asserted. Escalating
it into CAP-70 would duplicate a criterion rather than resolve a conflict.

**3. The write path's module scoping.**
AC-989 (STORY-100) reads and writes copy inside a module slot scoped by instance
and slot, and refuses an instance-rooted address that names no slot. It consumes
the addressing the edit render stamps (STORY-98) and the slot shapes the contract
defines (STORY-85) without asserting anything about either. Clean boundary.

### Residual finding — recorded, deliberately not acted on

STORY-82's **AC-718** ("contact-form presentation treatments are authored via
capability config + L1 slots") asserts declared `intro` and `submit` slots and a
plain-button fallback when `submit` is absent. **AC-701** (STORY-85) states the
current contract: those slots "are gone", replaced by one **required** `form`
slot carrying `control` leaves, with absence failing validation. Both live in
CAP-70, so the matrix holds a contradiction about the same module — AC-718 is
`pending`/`uat_coverage=fail` and still uses pre-REQ-87 "capability module"
naming; AC-701 is `active`/`pass`. STORY-82's other criterion, **AC-719**, restates
L1 leaf-axis behaviour already owned by STORY-83 / STORY-80.

This was **not** actioned here because it is a *within-capability* duplicate —
both stories sit in CAP-70, so there is no capability ambiguity to resolve, and
this pass's merge action is defined for stories in different capabilities.
Retiring AC-718/AC-719 would also leave STORY-82 criterion-less and make it an
archival candidate — reversing a prior reconciliation's deliberate decision to
repoint rather than archive it. That belongs to a within-capability consolidation
pass, with the evidence in front of it.

The finding is recorded durably on the story as COMMENT-862 (comment-ccb598c0)
so it survives this workflow.

### Verification

- Every story in the cluster belongs to exactly one capability; no
  `capability_uid` was changed, and each current assignment was verified against
  the deprecation/supersession trail (CAP-69 → CAP-70, CAP-72 → CAP-70,
  CAP-84 → CAP-87).
- No story was skipped: all four were read in full, along with all 47 of their
  acceptance criteria titles and the six boundary ACs in full text
  (AC-950, AC-809, AC-954, AC-989, AC-718, AC-701, AC-719).
- No merges were performed, so no AC relationships changed and no test renaming
  is required.
