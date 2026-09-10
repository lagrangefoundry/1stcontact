---
uid: acceptance_criterion-8a3c8c3e
id: AC-1045
type: acceptance_criterion
title: Asking a painted panel what it exposes returns the colour it is filled with,
  plus a closed picker of the site's images when it carries a background, and nothing
  else of its paint
created_by: xgd
created_at: '2026-08-10T08:23:08.470214+00:00'
updated_at: '2026-09-10T17:33:38.208464+00:00'
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

Requesting the editable fields of a region that is a **painted panel** succeeds
— through the *same* "what does this region expose" operation that answers for a
run of copy and for an image region, not a separate one — and returns **what
colour it is filled with**, plus, **when the panel carries one**, **which image
sits behind it**.

The current value returned for the fill is the one the panel holds today, and a
panel that declares none reports no value rather than a resolved or invented one.
The site's palette entries travel back with that answer, so a caller can draw the
choices it offers without a second call. Which panels are offered a fill at all,
and what may be written into it, are a separate criterion's business.

**The image field is offered only when the panel already carries a background
image.** It must hold a value, and its choices are a **closed list**, carried
with the field itself, of the handles the site's images can be referenced by —
the same list an image region's picker offers, so what a region can sit in front
of and what a panel can sit behind never disagree about what the site has. The
current value returned is the handle the panel paints today.

Nothing else of the panel's paint is offered: its corner radius, opacity,
overlay, pattern and gradient are not fields on this form. Nor is the image field
offered on a region of another kind that happens to carry a background — a run of
copy or an image region carrying one still exposes only its own fields.

## Verification

Address a painted panel region carrying a background image in a seeded site
whose asset store holds several images and whose definition declares a palette.
Request its fields and assert both are returned: a closed-list field marked as
requiring a value, whose options are the site's image handles (each once, in a
stable order) and whose returned current value is the handle in the draft; and a
colour field whose returned current value is the fill in the draft. Assert the
site's palette entries come back with the same answer. Address a second panel
carrying no background image and assert it returns the colour field and no image
field. Assert no field for any other paint parameter is present on either.
Assert a copy region and an image region in the same page still return their own
fields unchanged, including when they carry a background image of their own.
