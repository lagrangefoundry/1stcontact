---
uid: report-3c8170c0
id: REPORT-3564
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-09-09T23:03:14.304048+00:00'
updated_at: '2026-09-09T23:03:14.304048+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-e37a6b4a
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: A deployed capture that must not be challenged by the builder's own sign-in gate
**Stories resolved**: 1

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-7fa314f5 (STORY-125) | confirm | capability-aa030c83 (CAP-63) | (no change) | The mechanism is a property of *how a capture is taken*, not of how the gate admits or how the workspace serves. Verified against code and against the other two capabilities' own stated boundaries — see below. |

Merge was not available in this cluster: it contains a single story, and merge
requires two stories describing the same behaviour. The decision was therefore
between reassignment to CAP-103 / CAP-85 and confirmation in place.

### Why not the operator access gate (capability-3606e35b, CAP-103)

CAP-103 owns admitting or refusing an **inbound** caller, and its body places
what lies behind the gate outside its own scope. STORY-125 changes no rule
inside the gate — it is an *avoidance*: the deployment fulfils its own browser's
request in-process, so the request the gate would have judged is never made and
an outbound client of ours never becomes an inbound caller. The implementation
confirms this: `apps/control-app/src/shot.ts` contains no authorisation code and
touches nothing the gate owns. Reassigning here would fold a rule that is not a
gate rule into the gate, breaching CAP-103's stated boundary.

### Why not the builder workspace origin (capability-a994b8f3, CAP-85)

CAP-85 owns the workspace origin's route table and what it serves. STORY-125
adds **no route** and produces **no new rendering**: `router.ts` only *exports*
the memoised `previewRenderer` (`apps/control-app/src/router.ts:126`) so the
capture answers from the same instance the `/preview/*` route uses — which is
what AC-1474 (the capture shows the draft as it stands now) rests on. The route
table is unchanged. CAP-85 additionally places "the renderings themselves" and
"where the render runs" out of its own scope, both of which would have to be
pulled back in for this story to sit there.

### Why CAP-63 is correct

Self-origin fulfilment is an argument passed into the capture driver:
`shotPreview` builds a per-host resolver and hands it to the driver's `origin`
seam (`apps/control-app/src/shot.ts:118-122`). That makes it the same kind of
artifact as a viewport preset or a capture precondition — part of how a capture
is taken. Its failure mode is CAP-63's own animating invariant restated at the
capture end of the spine: a clean-looking result that is not faithful. A capture
that faithfully photographs a sign-in challenge is the "gate reports clean while
the render visibly differs" failure, one step upstream of the value axes.

It also sits with its sibling: story-080c6036 (cloud browser capture) is from
the same reconciliation bundle (`bundle-8eef3846`), is likewise deployed-runtime
capture, and is already filed on CAP-63. STORY-125 depends on it — that story
supplies the browser, this one makes the browser return the right document.

The residual asymmetry the survey detected is a **naming** one: CAP-63 is framed
around the `1c` CLI reproduction toolchain, while both `bundle-8eef3846` stories
are deployed-runtime capture. That is a question about the capability's title and
framing, not about story placement, and none of the three capabilities in this
cluster is a better home. Flagged here for structural rebalance rather than
resolved by a reassignment that would make the boundary worse.

### Evidence checked

- Story body, Technical Context and Reconciliation Decisions (the placement
  judgement and its rejected alternatives were re-derived independently here,
  not taken on trust).
- All three capability bodies in full, including CAP-63's two existing ownership
  rules and CAP-85's / CAP-103's out-of-scope clauses.
- Implementation: `apps/control-app/src/shot.ts`, `apps/control-app/src/router.ts`.
- UAT evidence: `tests/reconciliation-self-origin-capture.workers.test.ts` —
  one `test_UAT_AC<n>_*` per AC, AC-1469 through AC-1475.

### Ticket writes made

- `capability-aa030c83` — appended a History entry and an ownership rule
  ("how a capture is taken is owned here, even when it is taken of our own
  surface"), following the precedent of overlap clusters 3 and 4 on this same
  capability, so the boundary is not re-litigated. Content change on the
  capability only.

No story was reassigned, merged, archived or edited; no AC was reparented. All 7
ACs (acceptance_criterion-99e96d6c, -5d1bd686, -81139c56, -c9b7dfa5, -ba70ab5e,
-0e3243d4, -9104b7ac) remain parented to story-7fa314f5, which belongs to
exactly one capability. No test renaming was required, since no AC changed story
or number.
