---
uid: acceptance_criterion-2d587432
id: AC-1138
type: acceptance_criterion
title: Size, weight, italic and capitalisation all restyle the words in the editing
  box as each is confirmed, and nothing is written
created_by: xgd
created_at: '2026-08-13T01:08:41.637462+00:00'
updated_at: '2026-08-20T03:36:37.761043+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion

While the dialog is open, changing a parameter in the sheet beneath the words
**immediately restyles the words in the box above it**, so the operator judges
the change by looking at it rather than choosing blind, saving, and reloading the
page to find out what they chose. The parameters that reach the words are **how
big, how heavy, italic or not, and capitalised or not** — all four — each
confirmed by its own gesture: typing a number and leaving the field, picking from
a list, ticking a toggle.

A parameter turned back **off** clears the presentation it set rather than
leaving the last value standing: un-ticking italic returns the box to upright
rather than holding the italic it was last given, and choosing no capitalisation
returns the words to the casing they were written in. A control that went one way
and would not come back reads as having stopped working halfway.

**What must be true is that the words change, not that a value was written.**
The words are drawn by a control *inside* the box rather than by the box itself,
and it takes the box's typography by inheriting the font shorthand — which
carries family, size, weight and style and carries neither capitalisation nor
tracking, both of which the browser's own styling of form controls resets
besides. So a measurement taken on the box alone is satisfied by a property that
never reaches a glyph, which is exactly how this criterion once passed while
capitalisation moved nothing on screen. Both halves are therefore asserted for
capitalisation — the property is set on the box **and** the words are drawn that
way — so that a regression in either is attributable: the property stopping is
the sheet's subscription, the words stopping is the rule that restores the
inheritance the browser's reset broke.

**The previously recorded divergence is closed.** This criterion claimed three
parameters and recorded the fourth — capitalisation — as written but not
arriving. It now claims four, because the words inherit the two properties the
font shorthand cannot carry. The closure is the same one that makes an untouched
run's tracking mirror correctly, which is its own criterion: one cause, one fix,
two visible symptoms.

A parameter the box cannot show is still not guessed at. The presentation the box
mirrors is broader than the set of parameters the sheet exposes, and a parameter
with nothing to show for it changes nothing rather than dressing the box in a
value the page would not use.

Nothing here is a write. The change is staged exactly as it was before: nothing
is posted, the page behind the dialog does not re-render, and the origin is not
reached. Save remains the single moment anything is written and one dialog is
still one change, so an operator who previews a size and then cancels leaves no
trace of having looked.

## Verification

Open the dialog over a run of copy that exposes its words and its typography, in
a family that declares an italic face. Change the weight, tick italic, and change
the size, each by its own gesture, and after each assert that **the element the
words are actually drawn in** — not the box the properties are set on — is now
set that way. Un-tick italic and assert the words are drawn upright again rather
than holding the previous value.

Then choose a capitalisation and assert **both**: that the property is set on the
box, and that the words themselves are now drawn in that casing. Choose none
again and assert the words return to their written casing. Measure in a real
browser engine against the shipped stylesheets — a DOM implementation with no
user-agent stylesheet and no inherited-property resolution can represent neither
the reset nor the rule that restores it, and reads the same before and after the
fix — and where no browser can be launched, report the criterion loudly as
unverified rather than reducing it to something weaker.

Assert that throughout, no request is made to the origin and the page behind the
dialog is not re-rendered; then cancel and assert the page and the draft are
unchanged.
