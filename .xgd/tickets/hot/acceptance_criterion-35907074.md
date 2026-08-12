---
uid: acceptance_criterion-35907074
id: AC-1123
type: acceptance_criterion
title: A run's words open in the dressed box and its typography in a sheet beneath
  it, split by the control a field declares, staging into one save
created_by: xgd
created_at: '2026-08-12T18:26:56.287166+00:00'
updated_at: '2026-08-12T18:26:56.287166+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A dialog opened over a run of copy holds **two forms, not one**: the run's words
in the dressed editing box that mirrors the page's own presentation around them,
and the run's typography in a **separate, labelled sheet beneath that box**. The
sheet is below the words, never above them — a row of parameters over the copy
would read as a header on it.

**The split is decided by the kind of control a field declares**, never by the
region's kind and never by the field's name. A field that is plain words is drawn
in the box; every other shape a region can expose — a bounded number, a choice
from a list the surface supplied, a yes/no — is drawn in the sheet. So the day a
region exposes a second run of words, or a fifth parameter, neither half needs to
learn about it, exactly as the thumbnail grid is chosen by the descriptor rather
than by which region produced the field.

The box is drawn **only where there are words to put in it**: a region that
exposes no text at all — a painted panel offering only a background image —
renders no editing box, rather than a framed void beneath its picker.

The two forms are one edit. Values staged in either are read together when the
change map is built, so Save over a run whose words *and* size were changed is a
single change and a single re-rendering; a single unsaved-changes state spans
both, so a dialog in which only a parameter was touched saves it, and a dialog in
which nothing was touched in **either** writes nothing and re-renders nothing.
Dismissing the dialog by any route tears both forms down.

The sheet is **bounded in height and scrolls within its own bounds**, so the
footer — and therefore Save and Cancel — stays reachable however many parameters
a region exposes and however small the window, which is the same rule the
thumbnail grid obeys.

## Verification

Open the dialog over a run of copy that exposes both its words and its
typography. Assert the words' control is inside the editing box and no
typography control is; assert every typography control is inside the sheet and
the words' control is not; assert the sheet follows the box in the document.
Assert a region exposing no words at all renders no editing box. Change the words
in the box and a parameter in the sheet, confirm once, and assert a single change
carrying both and a single re-rendering. Touch only a parameter and assert
confirming saves it; touch nothing in either and assert confirming writes and
re-renders nothing. Shrink the viewport and assert the sheet is bounded and
scrolls while Save remains within the viewport and clickable.
