---
uid: acceptance_criterion-e751d14d
id: AC-2424
type: acceptance_criterion
title: 'Points last one turn: on send marks grey out and go inert, and the next render
  removes them and advances the render number'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:46.560406+00:00'
updated_at: '2026-11-08T13:05:16.886738+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- After a send that refers to at least one point, there are no live points left. A pill typed for an old letter afterwards does not expand.
- The sent marks stay visible on the preview, greyed out (dimmed and greyscale), with no `+` or `×` controls, and cannot be dragged.
- Until the next render, the greyed marks are still on screen and keep their letters. A point placed in that window gets the lowest letter not used by any mark on screen (after sending A and B, it is Point C).
- When the preview loads a new document (the next render), every mark is removed, greyed ones included, and lettering starts again at Point A. The render number reported in later points' expansions is higher than the one reported for points from the previous render.

## Verification
In the edit render harness, place Points A and B, refer to both, and send. Assert both marks are still present with the sent/greyed state, no visible controls, and that a drag does not move them. Assert the live point list is empty and `[Point A]` no longer expands. Place a point before re-render and assert it is labelled C. Rebind the overlay to a new preview document and assert no marks remain. Place a new point, assert it is labelled A, send, and assert its render number is one higher than the previous turn's.