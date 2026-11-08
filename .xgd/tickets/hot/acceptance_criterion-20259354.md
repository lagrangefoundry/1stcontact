---
uid: acceptance_criterion-20259354
id: AC-2418
type: acceptance_criterion
title: Dragging a mark moves its point and re-resolves it from where the drag ends
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:11.066757+00:00'
updated_at: '2026-11-08T16:24:15.598966+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- Pressing on a live (unsent) mark's cross and dragging moves the mark with the pointer. It keeps its label, and its pill in the draft stays where it is.
- On release, the point is worked out again from the drop position. Its expansion on send reports the segment under the drop position, the node-relative coordinates within that segment, and the document coordinates of the drop position. If the drag crossed into a different segment, nothing from the original segment is reported.
- Hovering a mark whose point lies inside a drawing shows the point's full formatted expansion as the mark's tooltip (its `title`), the same text the assistant receives for that point. It is set once the drawing is resolved and worked out again from where a drag ends, so a reused letter can always be told apart on screen. A mark on an L1 node that has never been inside a drawing carries no tooltip.
- A mark that has already been sent cannot be dragged.

## Verification
In the edit render harness, place Point A on one segment and assert its mark has no tooltip. Drag its cross with real pointer events and drop it inside the drawing. Send, and assert A's expansion names the drawing's segment and reports coordinates for the drop position. Assert the mark's `title` equals `formatMarkedPoint` of the re-resolved point, with the drop position's svg user-space and node-relative coordinates. After send, attempt a drag and assert the mark does not move. (The browser case in `reconciliation-marked-points-served-modules.test.ts` also asserts the tooltip carries the `near:` row on the un-injected measure path.)
