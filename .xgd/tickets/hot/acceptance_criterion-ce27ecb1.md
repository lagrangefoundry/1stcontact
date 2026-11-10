---
uid: acceptance_criterion-ce27ecb1
id: AC-2572
type: acceptance_criterion
title: An image in a chat message is bounded to the pane's width and a fixed maximum
  height
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:39:54.540618+00:00'
updated_at: '2026-11-10T00:54:51.394548+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
In the builder's chat pane, an image inside a message is laid out as a block that never exceeds the pane's width (`max-width: 100%`) and is at most 260px tall. It keeps its aspect ratio (`width`/`height: auto`), so a tall picture does not push the sentence that introduced it out of view. The full image bytes are still fetched; nothing is made smaller on the wire.

## Verification
Read the builder stylesheet the control app serves. Assert that a rule targeting images inside the builder chat sets `max-width: 100%`, a `max-height` of 260px, and auto width and height.



## UATs
- `tests/reconciliation-assistant-picture-in-the-turn.test.ts` — `test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane`: the builder stylesheet's `.builder-chat img` rule sets `max-width: 100%`, `max-height: 260px`, `width: auto` and `height: auto`.
