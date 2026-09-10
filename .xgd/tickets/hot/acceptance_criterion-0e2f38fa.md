---
uid: acceptance_criterion-0e2f38fa
id: AC-1130
type: acceptance_criterion
title: A picture's colour is adjusted through bounded whole-number controls over the
  form the definition holds, and a control returned to its identity leaves the definition
  exactly as it found it, container and all
created_by: xgd
created_at: '2026-08-12T21:29:03.861779+00:00'
updated_at: '2026-09-10T18:14:08.988930+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A picture's colour is adjusted through **bounded whole-number controls** — how
bright, how contrasty, how saturated and how black-and-white, each in
**percent**; how far its hue is shifted, in **degrees**; and how far it is
blurred, in **pixels** — while the region stores the adjustment in the form a
browser reports it in.

Where the control is a **projection** of the stored parameter rather than the
parameter itself, the two carry different names and different numbers on
purpose: "saturation 40%" is what an operator means, and the fraction is what
the definition holds, so a page folded from a capture and a page adjusted by
hand express the same adjustment the same way. That is true of the four
**percentage** adjustments — brightness, contrast, saturation and
black-and-white. The hue shift and the blur **are** the axis — same name, same
number, nothing converted — because a control is a projection only where it is
one, which is the rule already at work where italic projects onto the parameter
beneath it.

**A control at its identity leaves the definition exactly as it found it.** The
identity is not the same number for every control — unchanged (100%) for
brightness, contrast and saturation, none-at-all (0) for black-and-white, the
hue shift and the blur — so each is judged against its own. That partition is
deliberately not the percentage one above: black-and-white is submitted as a
percentage like the first three, but paints nothing at zero rather than at a
hundred, so which unit a control carries says nothing about where its identity
sits. Saving a control at its identity removes that adjustment from the region,
and removing the last one removes the group holding them, leaving no empty
container behind.

Selecting several adjustments in one form produces one change to the site, not
one per adjustment.

## Verification

Save several colour adjustments on an image region in a single change map and
assert the save succeeds and the stored region carries each **percentage**
adjustment in the browser's own form, converted from the percentage that was
submitted. Assert that the hue shift and the blur are held under the same name
the control offers, with no conversion between what is submitted and what is
stored. Assert the rendered page carries the adjustment. Save each of those
controls back to its own identity — a hundred for brightness, contrast and
saturation, zero for black-and-white — and assert the region carries no colour
adjustment at all and no empty group in its place. Assert that a control left at
its identity throughout is never written.
