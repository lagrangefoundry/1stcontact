---
uid: comment-2da92c95
id: COMMENT-2357
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-09-09T23:03:34.006984+00:00'
updated_at: '2026-09-09T23:03:34.006984+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3c8170c0
  kind: note
---

Cluster 1 resolved.

## Decision: **Confirm** — `story-7fa314f5` (STORY-125) stays on `capability-aa030c83` (CAP-63)

Merge wasn't an option — the cluster holds a single story — so the real choice was reassign to CAP-103/CAP-85 or confirm. I re-derived the placement independently rather than trusting the story's own Technical Context, and checked it against the code.

**Not the access gate (CAP-103).** CAP-103 owns admitting/refusing an *inbound* caller and places what lies behind the gate outside its scope. This story is an avoidance, not a gate rule: the deployment fulfils its own browser's request in-process, so the request the gate would judge is never made. `apps/control-app/src/shot.ts` contains no authorisation code at all.

**Not the workspace origin (CAP-85).** The work adds no route and produces no rendering. `router.ts:126` only *exports* the memoised `previewRenderer` so the capture answers from the same instance `/preview/*` uses — which is exactly what AC-1474 rests on. CAP-85 also puts "the renderings themselves" and "where the render runs" out of its own scope.

**Why CAP-63 holds.** Self-origin fulfilment is an argument into the capture driver — `shotPreview` builds a per-host resolver and passes it to the driver's `origin` seam (`shot.ts:118-122`). Same kind of artifact as a viewport preset or capture precondition. Its failure mode is CAP-63's animating invariant one step upstream of the value axes: a clean-looking result that isn't faithful. It also sits with its sibling `story-080c6036` (same bundle, also deployed-runtime capture, already on CAP-63) that it depends on.

**One thing I flagged rather than fixed:** the asymmetry the survey detected is real but is a *naming* problem — CAP-63 is framed around the `1c` CLI toolchain while both `bundle-8eef3846` stories are deployed-runtime capture. That's a structural-rebalance question about the capability's framing, not a story-placement one, and none of the three candidate capabilities is a better home. Recorded in the report instead of papering over it with a reassignment that would worsen the boundary.

**Writes made:**
- `capability-aa030c83` — appended a History entry and ownership rule ("how a capture is taken is owned here, even when it is taken of our own surface"), following the precedent of clusters 3 and 4 on this same capability. Content change on the capability only.
- `report-3c8170c0` (REPORT-3564) — `overlap_resolution`, `cluster_id: "1"`, `subject_uid: report-e37a6b4a`, result `pass`. Fields verified after creation.

**Verified:** no story reassigned, merged, archived or edited; all 7 ACs still parented to `story-7fa314f5`, which belongs to exactly one capability; no test renaming needed since no AC changed story or number.
