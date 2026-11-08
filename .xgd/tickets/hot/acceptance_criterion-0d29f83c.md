---
uid: acceptance_criterion-0d29f83c
id: AC-2415
type: acceptance_criterion
title: A fresh label fades only when the pointer leaves its asymmetric reach or the
  next point lands, and returns on hover
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:45:59.571874+00:00'
updated_at: '2026-11-08T12:45:59.571874+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- A newly placed point's label is visible and its `+` and `×` controls can be clicked.
- The label stays visible while the pointer is within the mark's reach: up to 200px to the right of the point, and up to 56px to the left, above and below. Moving from the mark to the label's `×`, about 100px to the right, does not fade it.
- A pointer resting on the mark's own chrome (cross, label, or controls) never fades the label, however long it stays there.
- The label fades when the pointer moves outside that reach (more than 200px to the right, or more than 56px left, up or down), or when another point is placed. Only the newest point's label stays visible.
- The label never fades because time has passed. With the pointer held inside the reach, it stays visible indefinitely.
- Hovering a faded mark shows its label and controls again.

## Verification
Drive real pointer events over the edit render. Move the pointer from the point to the right along the label, past the `×` and up to just inside 200px, and assert the label is still visible. Rest on the label and assert it stays. Move beyond 56px vertically and assert it fades. Place a second point and assert the first label has faded. Hover the first mark and assert its label is visible again.
