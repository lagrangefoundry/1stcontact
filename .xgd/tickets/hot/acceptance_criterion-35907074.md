---
uid: acceptance_criterion-35907074
id: AC-1123
type: acceptance_criterion
title: A run's words open in the dressed box and its colour and typography in a sheet
  beneath it, split by the control a field declares, staging into one save
created_by: xgd
created_at: '2026-08-12T18:26:56.287166+00:00'
updated_at: '2026-08-20T03:37:15.076203+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A dialog opened over a run of copy holds **two forms, not one**: the run's words
in the dressed editing box that mirrors the page's own presentation around them,
and everything else about how that run is set — its colour and its typography —
in a **separate, labelled sheet beneath that box**. The sheet is below the words,
never above them — a row of parameters over the copy would read as a header on
it.

**The split is decided by the kind of control a field declares**, never by the
region's kind and never by the field's name. A field that is plain words is drawn
in the box; every other shape a region can expose — a bounded number, a choice
from a list the surface supplied, a yes/no, a colour — is drawn in the sheet. So
the day a region exposes a second run of words, or a fifth parameter, neither
half needs to learn about it, exactly as the thumbnail grid is chosen by the
descriptor rather than by which region produced the field.

The sheet holds **one order, and it is the surface's**. The colour rows and the
typed parameters are drawn by two different controls, and a control the dialog
draws itself must not reorder the field list the surface declared — that list is
the contract about what a region exposes *and* in what order it reads.

The box is drawn **only where there are words to put in it**: a region that
exposes no text at all — a painted panel offering only a background image and its
colour — renders no editing box, rather than a framed void beneath its picker.
The sheet is drawn wherever there is anything to put in it, so a region exposing
only a colour still gets a sheet and no box.

The two forms are one edit. Values staged in either — and in the controls the
dialog draws itself — are read together when the change map is built, so Save
over a run whose words *and* size *and* colour were changed is a single change
and a single re-rendering; a single unsaved-changes state spans them all, so a
dialog in which only a parameter was touched saves it, and a dialog in which
nothing was touched in **any** of them writes nothing and re-renders nothing.
Dismissing the dialog by any route tears every form down.

The sheet is **bounded in height and scrolls within its own bounds**, so the
footer — and therefore Save and Cancel — stays reachable however many parameters
a region exposes and however small the window, which is the same rule the
thumbnail grid obeys.

## Verification

Open the dialog over a run of copy that exposes its words, its colour and its
typography. Assert the words' control is inside the editing box and no colour or
typography control is; assert every colour and typography control is inside the
sheet and the words' control is not; assert the sheet follows the box in the
document, and that the sheet's rows appear in the order the surface declared
them. Assert a region exposing no words at all renders no editing box, and that a
region exposing only a colour renders a sheet and no box. Change the words in the
box, a parameter in the sheet and the colour, confirm once, and assert a single
change carrying all three and a single re-rendering. Touch only a parameter and
assert confirming saves it; touch nothing in any of them and assert confirming
writes and re-renders nothing. Shrink the viewport and assert the sheet is
bounded and scrolls while Save remains within the viewport and clickable.
