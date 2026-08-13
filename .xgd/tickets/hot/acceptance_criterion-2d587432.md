---
uid: acceptance_criterion-2d587432
id: AC-1138
type: acceptance_criterion
title: Changing a typography parameter immediately restyles the words in the editing
  box, and writes nothing
created_by: xgd
created_at: '2026-08-13T01:08:41.637462+00:00'
updated_at: '2026-08-13T01:08:41.637462+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

While the dialog is open, changing a parameter in the sheet beneath the words
**immediately restyles the words in the box above it**, so the operator judges
the change by looking at it rather than choosing blind, saving, and reloading the
page to find out what they chose. Each of the parameters a run of copy exposes
reaches the box as the operator confirms it — how big, how heavy, italic or not,
capitalised or not — and each confirms by its own gesture: typing a number and
leaving the field, picking from a list, ticking a toggle.

A parameter turned back **off** clears the presentation it set rather than
leaving the last value standing: un-ticking italic returns the box to upright and
choosing no capitalisation returns it to the words as typed. A control that went
one way and would not come back reads as having stopped working halfway.

A parameter the box cannot show is not guessed at. The presentation the box
mirrors is broader than the set of parameters the sheet exposes — a run's colour
is dressed from the page and has no control yet — and a parameter with nothing to
show for it changes nothing rather than dressing the box in a value the page
would not use.

Nothing here is a write. The change is staged exactly as it was before: nothing
is posted, the page behind the dialog does not re-render, and the origin is not
reached. Save remains the single moment anything is written and one dialog is
still one change, so an operator who previews a size and then cancels leaves no
trace of having looked.

## Verification

Open the dialog over a run of copy that exposes its words and its typography, in
a family that declares an italic face. Change the weight, tick italic, and choose
a capitalisation, each by its own gesture, and after each assert the box's copy
is now set that way. Un-tick italic and choose no capitalisation, and assert the
box returns to upright and to the words as typed rather than holding the previous
values. Assert that throughout, no request is made to the origin and the page
behind the dialog is not re-rendered; then cancel and assert the page and the
draft are unchanged.
