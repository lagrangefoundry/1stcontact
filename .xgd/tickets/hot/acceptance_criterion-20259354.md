---
uid: acceptance_criterion-20259354
id: AC-2418
type: acceptance_criterion
title: Dragging a mark moves its point and re-resolves it from where the drag ends
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:11.066757+00:00'
updated_at: '2026-11-08T12:46:11.066757+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- Pressing on a live (unsent) mark's cross and dragging moves the mark with the pointer. It keeps its label, and its pill in the draft stays where it is.
- On release, the point is worked out again from the drop position. Its expansion on send reports the segment under the drop position, the node-relative coordinates within that segment, and the document coordinates of the drop position. If the drag crossed into a different segment, nothing from the original segment is reported.
- A mark that has already been sent cannot be dragged.

## Verification
In the edit render harness, place Point A on one segment, then drag its cross with real pointer events and drop it inside another segment. Send, and assert A's expansion names the second segment and reports coordinates for the drop position. After send, attempt a drag and assert the mark does not move.
