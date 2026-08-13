---
uid: acceptance_criterion-2d587432
id: AC-1138
type: acceptance_criterion
title: Changing a typography parameter immediately restyles the words in the editing
  box, and writes nothing
created_by: xgd
created_at: '2026-08-13T01:08:41.637462+00:00'
updated_at: '2026-08-13T01:37:51.320375+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

While the dialog is open, changing a parameter in the sheet beneath the words
**immediately restyles the words in the box above it**, so the operator judges
the change by looking at it rather than choosing blind, saving, and reloading the
page to find out what they chose. The parameters that reach the words are **how
big, how heavy, and italic or not**, each confirmed by its own gesture: typing a
number and leaving the field, picking from a list, ticking a toggle.

A parameter turned back **off** clears the presentation it set rather than
leaving the last value standing: un-ticking italic returns the box to upright
rather than holding the italic it was last given. A control that went one way and
would not come back reads as having stopped working halfway.

**Capitalisation is written but does not arrive, and that is a recorded
divergence from what was asked for.** REQ-138 names four parameters and this
criterion claims three. The fourth is not skipped in the implementation — the
sheet's capitalisation is written on the box exactly like the others, and cleared
when the operator chooses no capitalisation — but it never reaches the copy. The
words are drawn by the shared form component's control, which takes the box's
typography by inheriting the whole font shorthand; that shorthand carries family,
weight, style and size and does **not** carry capitalisation, which the browser's
own styling of form controls resets. So an operator changing Capitalisation sees
nothing move, which is what they reported on the anchor ticket. It is not a
regression introduced here: the same property has been written on the box since
the box was first dressed from the page, and the same hole was already under it.
Closing it means changing what the words are drawn in, and that is separate work.

A parameter the box cannot show is not guessed at. The presentation the box
mirrors is broader than the set of parameters the sheet exposes — a run's colour
is dressed from the page and has no control yet — and a parameter with nothing to
show for it changes nothing rather than dressing the box in a value the page
would not use.

Nothing here is a write. The change is staged exactly as it was before: nothing
is posted, the page behind the dialog does not re-render, and the origin is not
reached. Save remains the single moment anything is written and one dialog is
still one change, so an operator who previews a size and then cancels leaves no
trace of having looked. This holds for capitalisation too — it is staged and
saved like any other parameter, and lands on the page on Save; it is only the
*preview* of it that does not arrive.

## Verification

Open the dialog over a run of copy that exposes its words and its typography, in
a family that declares an italic face. Change the weight, tick italic, and change
the size, each by its own gesture, and after each assert that **the element the
words are actually drawn in** — not the box the properties are set on — is now
set that way. Measuring the box instead proves only that a property was written,
which is the mistake that let this criterion's capitalisation clause pass while
the behaviour was absent. Un-tick italic and assert the words are drawn upright
again rather than holding the previous value.

Then assert the divergence as a pair, so a change in either direction is visible:
choose a capitalisation, assert the property **is** set on the box, and assert the
words' own capitalisation is **unchanged**. The day the words are drawn in
something that carries that property, this assertion fails and the criterion is
rewritten to claim what the intent asked for.

Assert that throughout, no request is made to the origin and the page behind the
dialog is not re-rendered; then cancel and assert the page and the draft are
unchanged.
