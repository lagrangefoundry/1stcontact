---
uid: acceptance_criterion-8acf277e
id: AC-1043
type: acceptance_criterion
title: The form is sized for real copy with a tall resizable editing area, and Save
  stays reachable at every window size
created_by: xgd
created_at: '2026-08-10T07:48:20.976780+00:00'
updated_at: '2026-08-16T04:19:22.291188+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The form is sized for real copy rather than for a property sheet: the panel is
wide enough to read a paragraph at something like the width it will be read at,
and the editing area is tall and resizable by the operator.

It never outgrows the window. However long the copy and however small the
window, the panel stays within the viewport and the footer — and therefore Save
and Cancel — stays reachable without the operator having to shrink anything
first. A grid of thumbnails obeys the same rule from the other direction:
however many images the site holds, the grid is bounded and scrolls within its
own bounds rather than pushing the footer out of the dialog.

A dialog that is one sentence and a Close button is not stretched to a copy
editor's width; it stays narrow. That narrowing is keyed on the absence of **any
editing surface** rather than on the presence of a message: a refusal appearing
inside an open form does not snap the panel narrower around copy the operator is
still holding, and a dialog that is all thumbnails and no text keeps the full
width even though it has no editing box — it is a grid of pictures, which is the
one thing that needs the width most.

## Verification

Open the form over a long run of copy and assert the panel's width is the
copy-editing width and the editing area's height is a substantial fraction of
the viewport. Shrink the viewport well below the panel's natural height and
assert the panel is still within it and the Save control is still within the
viewport and clickable. Assert the editing area is resizable by the operator.
Open a nothing-to-edit dialog and assert the narrower width. Then provoke a
refusal in an open fields form and assert its width is unchanged. Open a dialog
that exposes only an image choice and assert it takes the full width rather than
the message width, with Save reachable.