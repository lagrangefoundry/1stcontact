---
uid: acceptance_criterion-f8ea23cf
id: AC-1132
type: acceptance_criterion
title: A picture carrying no framing parameters answers with the values a browser
  would actually paint — its fill mode, its centre, unrotated and unadjusted — rather
  than with blanks
created_by: xgd
created_at: '2026-08-12T21:29:33.129250+00:00'
updated_at: '2026-08-12T21:29:33.129250+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A picture that declares no framing parameters at all answers with **the values a
browser would actually paint it at** — the initial fill mode, dead centre in both
directions, unrounded, unturned, at full size, and every colour adjustment at its
own identity — rather than with blanks or absent fields.

A control that cannot say what a thing is now is a control nobody can use: an
operator moving a slider from an empty position has no idea what they are moving
it from, and a client cannot render a form field with no value. Because the
reported values are the ones the browser is already painting, they are also the
ones a save that touches nothing else will correctly treat as no change.

The values are reported as whole numbers, matching what the controls accept.

## Verification

Address an image region that declares no framing parameters whatsoever and assert
that every framing, shape and colour field is present in the answer with the
value a browser would paint — the initial fill mode, both position components at
centre, zero rounding, zero turn, full scale, and each colour adjustment at its
identity — and that none is blank or missing. Save that exact set of values back
and assert the save succeeds, reports nothing changed, leaves the region still
declaring no framing parameters and no empty group in their place, and leaves the
stored draft byte-for-byte unchanged.
