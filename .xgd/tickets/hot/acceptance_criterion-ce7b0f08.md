---
uid: acceptance_criterion-ce7b0f08
id: AC-2413
type: acceptance_criterion
title: Mark Points toggle exists only in Edit mode and reassigns the preview click
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:45:42.875491+00:00'
updated_at: '2026-11-08T13:05:19.540768+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- In Edit mode the builder shows a "Mark Points" toggle. In View mode the toggle is not offered.
- With the toggle off, clicking a segment on the edit preview opens that segment's editor, as before.
- With the toggle on, clicking the preview places a point and opens no editor. The mode is visibly on: the preview body carries the mode marker, the cursor is a crosshair, and hover outlines are kept but dimmed.
- Turning the toggle off, or leaving Edit mode, turns the mode off. Clicking a segment then opens its editor again, exactly as if the mode had never been on.

## Verification
Load the real edit render in a browser harness with the builder's overlay bound. Click a segment with the toggle off and assert its editor opens. Turn the toggle on, click the same segment, and assert a point mark appears and no editor opens. Turn the toggle off, click again, and assert the editor opens.