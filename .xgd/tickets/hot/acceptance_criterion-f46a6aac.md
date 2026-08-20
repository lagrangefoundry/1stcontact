---
uid: acceptance_criterion-f46a6aac
id: AC-1249
type: acceptance_criterion
title: 'A colour is typed here: the native control and the text field mirror each
  other, and applying repaints the displayed page without a manual refresh'
created_by: xgd
created_at: '2026-08-20T01:59:29.280581+00:00'
updated_at: '2026-08-20T02:20:58.038595+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

The surface is where a colour is typed. It offers free colour entry on the selected entry through a
native colour control and a text field that are one value: typing a colour into the text field
updates the native control, dragging the native control updates the text field, and applying submits
whichever the operator last set.

Applying reports how many uses were repainted, and the page displayed beside the surface shows the
new colour — at every position that colour is used — without the operator refreshing anything.

## Verification

Open the surface beside a displayed page that paints one entry at several positions in its family.
Select that entry; drag the native colour control and observe the text field follow; type a colour
form the native control cannot express and observe it accepted. Apply, and observe a message naming
the number of uses repainted. Without any further operator action, observe the displayed page
painting the new colour at each position it previously painted the old one, and other entries
unchanged.