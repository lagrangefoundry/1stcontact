---
uid: acceptance_criterion-06e26108
id: AC-2423
type: acceptance_criterion
title: The chat bubble shows the pill form while the assistant's turn carries the
  expansion; pills survive cut and paste in the composer
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:42.120873+00:00'
updated_at: '2026-11-08T13:05:17.358658+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- After sending a draft that contains `[Point A]`, the user's message bubble in the chat panel shows the draft as typed, with the short pill. It does not show the coordinate blocks.
- The turn sent to the assistant (and recorded in the session transcript) contains the full expansion for Point A.
- Cutting `[Point A]` from the real composer and pasting it elsewhere in the draft keeps it working. On send, the pasted pill expands to Point A exactly as if it had never moved.

## Verification
Mount the real chat panel and composer in the builder harness with the overlay bound. Place Point A, cut its pill from the composer and paste it at a different position, then send. Assert the rendered user bubble contains `[Point A]` and no `Marked points (this turn):` heading, while the outgoing turn payload contains the heading and A's block.