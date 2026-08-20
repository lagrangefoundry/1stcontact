---
uid: acceptance_criterion-4fbdaf70
id: AC-1244
type: acceptance_criterion
title: Selecting an entry reveals a continuous light-dark position control whose preview
  is the colour the page will paint
created_by: xgd
created_at: '2026-08-20T01:58:57.977779+00:00'
updated_at: '2026-08-20T01:58:57.977779+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

With no entry selected the surface offers no position control — a position relative to nothing is
meaningless. Selecting an entry reveals a **continuous** light↔dark position control spanning the
full declared range from darkest through the colour itself to lightest, at a resolution far finer
than a handful of named stops, together with a preview of the colour at the current position and a
readout of that colour.

The previewed colour is **identical** to the colour the rendered page paints for a reference to that
entry at that position — the surface previews with the same arithmetic the renderer resolves with,
not with a second implementation of it. Moving the control updates the preview and readout
continuously, without losing the drag.

## Verification

Open the surface and observe no position control before a selection. Select an entry; observe a
control whose range spans darkest to lightest with the colour itself at the centre, and whose
granularity admits at least hundreds of distinct positions. Move it to an arbitrary off-centre
position and compare the readout against the colour the renderer produces for that entry at that
same position — they must match exactly. Confirm the control retains focus across repeated
movements.
