---
uid: acceptance_criterion-3648a0a0
id: AC-1131
type: acceptance_criterion
title: The shapes a picture offers include whatever shape it already carries, even
  one this surface does not offer, so saving something else about it cannot silently
  reshape it
created_by: xgd
created_at: '2026-08-12T21:29:19.255021+00:00'
updated_at: '2026-08-12T21:44:39.802354+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

The shapes an image region offers are the geometric ones — no shape at all, a
circle, an ellipse, a leaning quadrilateral, an organic outline — **plus whatever
shape the picture already carries**, even one this surface does not itself offer.

That union is a correctness rule, not a convenience. A chooser whose options omit
its own value presents the *first* option as selected, so a picture the AI or a
captured design had given an edge treatment would be silently squared off by an
operator who opened it to change its alt text and saved. Re-saving such a picture
with its own shape reports nothing changed and leaves the shape and its own
parameters exactly as they were.

Choosing a shape writes **the shape alone**; the parameters a shape carries
belong to the shape that names them, so a shape chosen here takes the renderer's
own defaults for the rest and tuning them stays with the AI. Choosing "no shape
at all" removes the shape from the region outright rather than recording it.

## Verification

Seed an image region carrying an edge-treatment shape this surface does not offer
and a parameter belonging to it. Request the region's fields and assert the shape
control's options are the geometric set with that shape appended, and that the
reported current value is that shape. Re-save the region with that shape and a
new alt text, and assert the save succeeds, reports only the alt text as changed,
and leaves the shape and its parameter untouched. On a picture carrying no shape,
save a geometric shape and assert the stored region carries that shape and no
other parameter alongside it; then save "no shape at all" and assert the shape is
absent from the region entirely.