---
uid: acceptance_criterion-d917f63c
id: AC-2419
type: acceptance_criterion
title: On send each referenced point expands to a block carrying every spatial frame,
  the viewport width, and the render it was taken against
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:21.748840+00:00'
updated_at: '2026-11-08T12:46:21.748840+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
The turn the assistant receives contains the draft prose with each `[Point X]` written as plain `Point X`. After the prose comes the heading `Marked points (this turn):` and then one block per referenced point, in the order the points first appear in the draft. Each block contains:
- a first line `Point X — <where>`, where `<where>` names the segment the point is in (its module and slot when it is inside a module, its kind, and its node path), or says the point is not inside any editable segment, and adds `(asset <src>)` when the point is inside a drawing;
- `svg user space: (x, y) [viewBox a b c d]`, only when the point is inside an SVG drawing;
- `node-relative: (x, y) of W×H`, only when the point is inside a segment;
- `viewport: (x, y) at width W`, where (x, y) are **document** coordinates (scroll offset included, so scrolling the preview before clicking does not change the reported page position) and W is the preview's viewport width in CSS px; device pixel ratio is never reported;
- `near: ...`, only when anchor lines were measured (see the anchors AC);
- `render: page <page>, render <n>`, where n is the number of the preview render the point was taken against.

When any referenced point is not inside a drawing, the expansion also says that L1 geometry is keyframed across widths and tells the assistant to ask which width the instruction is for unless the user has said.

## Verification
In the edit render harness, scroll the preview, then place points both inside an SVG image node and on a plain L1 node, and send. Assert the turn contains the heading and one block per point with the rows above. Assert the viewport row equals the click's client coordinates plus the scroll offset, with the preview's width. Assert the render row matches the current render number, and the width note is present because one point is on an L1 node. With only drawing points sent, assert the width note is absent.
