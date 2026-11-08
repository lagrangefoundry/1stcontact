---
uid: acceptance_criterion-00d2ad51
id: AC-2417
type: acceptance_criterion
title: Label + re-inserts a pill for its point; × deletes the point and every pill
  referring to it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:07.287514+00:00'
updated_at: '2026-11-08T13:05:18.667155+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- Clicking `+` on Point X's label appends another `[Point X]` pill to the draft. If the original pill was deleted from the draft, the restored pill expands on send to the same point.
- Clicking `×` on Point X's label removes the mark from the preview and removes every `[Point X]` pill from the draft. The rest of the draft text is untouched.
- Clicking `+` or `×` never places a new point and never opens a segment editor.

## Verification
In the edit render harness, place Point A, clear the draft, click `+` on A's label, and assert the draft contains `[Point A]` and the expansion on send describes A's coordinates. Add a second pill for A, click `×`, and assert the mark is gone, the draft has no `[Point A]`, and the mark count did not go up.