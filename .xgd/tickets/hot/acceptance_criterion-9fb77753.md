---
uid: acceptance_criterion-9fb77753
id: AC-2518
type: acceptance_criterion
title: The channel left behind stays connected and laid out, hidden by visibility
  and never taken out of layout
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:34.147854+00:00'
updated_at: '2026-11-09T03:11:34.147854+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The channel left behind stays connected and laid out, so it keeps its scroll
offset ([[BUG-79]]). An idle frame is hidden by visibility. It is never hidden
by the `hidden` attribute or by `display: none`, because an iframe taken out of
layout loses its scroll offset. It is unpainted and cannot be interacted with,
but it keeps its size and position. Only the frame the pane is showing carries
the "shown frame" class (`.builder-panel__frame`). Every frame carries the pane
geometry class (`.builder-panel__pane`).

## Verification

Mount the real builder composition and switch from View to Edit. Assert the View
frame is still connected to the document, has no `hidden` attribute, and has a
computed `display` other than `none`. Assert its computed `visibility` is
`hidden` and it receives no pointer events. Assert exactly one frame carries
`.builder-panel__frame`, and that it is the frame the pane reports as shown.

Reference UAT: `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`
(the_channel_left_behind_stays_laid_out).
