---
uid: report-669d7e37
id: REPORT-3567
type: report
title: 'Overlap resolution: cluster 2'
created_by: xgd
created_at: '2026-09-09T23:07:15.523455+00:00'
updated_at: '2026-09-09T23:07:15.523455+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-e37a6b4a
  cluster_id: '2'
---

## Cluster 2 Resolution

**Boundary**: Capture as a capacity of the deployed runtime vs. platform deployment configuration
**Capabilities**: CAP-63 (capability-aa030c83, 1c Capture & Diff Fidelity) vs. CAP-102 (capability-5d07b533, Platform Build, Deploy & Live-Origin Verification)
**Stories resolved**: 1 of 1

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-080c6036 (STORY-124, Cloud browser capture) | confirm | capability-aa030c83 (CAP-63) | (no change) | The story's subject is *how a capture is taken*, which CAP-63 already owns by a rule recorded on this same capability the same day; the deployment-configuration half is owned by CAP-102's STORY-119 and is explicitly deferred to, not restated. Clean boundary, no duplicated AC. |

### Why this is a clean boundary, not a misfiling

The two sides are separated by a test that needs no judgement, because each side
already states its own half:

- **CAP-102 / STORY-119 owns the configuration.** AC-1341 asserts every Worker's
  named environment repeats every top-level variable and binding, with bindings
  identified **structurally** (any block carrying a binding name) — deliberately so
  that a binding kind introduced later, such as the browser binding this story
  introduced, is covered without the check being edited. Its evidence is the
  *parsed configuration*, across the tree.
- **CAP-63 owns the runtime consequence.** AC-1461 asserts what a *running*
  deployment does when the capability is absent: it boots, editing/rendering/
  publishing are unaffected, and only a screenshot fails, with a named catchable
  error identifying the missing configuration entry. Its evidence is a *started
  deployment* exercised through a real screenshot request.

A static property of configuration files and a dynamic property of a running
deployment are different artifacts, so neither criterion can absorb the other.
STORY-124's own Technical Context already records the deferral in these terms:
"That guarantee is already owned by the deploy-configuration story… No AC here
restates it; this story claims only the browser-specific consequence: a deployment
either takes the picture or names what it lacks."

### AC-level duplication check

All 10 ACs on STORY-124 (AC-1459 … AC-1468) and all 18 on STORY-119 were reviewed
for restatement. No duplication found. The two nearest-adjacent pairs:

- **AC-1461** (no browser configured → boots, only screenshot fails) vs **AC-1341**
  (named environments repeat every binding): runtime behaviour vs. configuration
  property, as above.
- **AC-1468** (the deployed app's module graph carries the cloud browser library and
  never reaches the local Node browser-automation stack; the browser is acquired in
  exactly one place) vs **AC-1426** (the build refuses a Worker whose type program
  reaches a filesystem-bound module, naming the chain): AC-1468 is a static property
  of *this* deployment's dependency pairing, asserted by a graph walk; AC-1426 owns
  the build command's generic refusal *mechanism*. Checker vs. checked fact —
  different subjects and different evidence.

### Consistency with prior resolutions

Cluster 1 (2026-09-09) confirmed the sibling story STORY-125 (self-origin
fulfilment) in place in CAP-63 and recorded the governing rule: *how a capture is
taken is owned here, even when it is taken of our own surface* — including the
transport the capture's browser is given. That entry already names
story-080c6036 as the other of the two `bundle-8eef3846` capture stories filed in
CAP-63, and already diagnoses the survey signal: "both are deployed-runtime capture
rather than `1c` CLI capture, which is what drew the survey's eye." Cluster 2 is the
same question asked about the other half of the pair, and the recorded rule answers
it without amendment.

CAP-63's scope text also independently corroborates the placement: its CLI-wide
ownership rule states "the gated command set is asserted entire so that **adding a
browser-driving verb** without gating it is a visible regression rather than a
silent hole" — the exact phrase STORY-124 cites as its placement justification.

### Ticket changes made

No story was reassigned, merged or archived; no story content was modified; no AC
was reparented, so no `test_UAT_AC<n>_*` renaming was required.

One documentation write, on the capability rather than the story: the boundary rule
above was appended to CAP-63's body, matching the precedent set by clusters 1, 3 and
4 in that capability's own History section, so the question is not re-litigated on
the next survey.

### Recorded defect, deliberately not repaired here

STORY-124's Technical Context reads "Filed under CAP-102 (1c Capture & Diff
Fidelity)". The parenthetical **name** is correct and matches where the story
actually sits (capability-aa030c83); the **numeral is stale** — CAP-102 is the
deployment capability the story is being distinguished *from*, and the scope phrase
the same sentence goes on to quote belongs to CAP-63.

This single wrong numeral is the most likely reason the pair surfaced as a cluster
at all: a reader of the story body sees CAP-102 named as its home while its
`capability_uid` points at CAP-63. It was left unrepaired because a confirm makes no
content change and this step is constrained not to modify story content — it will
keep surfacing on future surveys until a step permitted to edit story content
corrects the numeral to CAP-63. Flagging for the operator.

### Verification

- STORY-124 belongs to exactly one capability (capability-aa030c83), unchanged.
- No story in the cluster was skipped: 1 of 1 resolved.
- No merges performed, so all AC relationships are trivially preserved; all 10 ACs
  remain parented to story-080c6036.
