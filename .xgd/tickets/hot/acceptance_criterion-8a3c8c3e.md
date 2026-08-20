---
uid: acceptance_criterion-8a3c8c3e
id: AC-1045
type: acceptance_criterion
title: Asking a painted panel what it exposes returns the colour it is filled with,
  plus a closed picker of the site's images when it carries a background, and nothing
  else of its paint
created_by: xgd
created_at: '2026-08-10T08:23:08.470214+00:00'
updated_at: '2026-08-20T02:53:56.986522+00:00'
completed_at: null
last_field_updated: title
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

**The fill is offered on every painted panel**, whatever it paints by. A panel
that paints only a rounded corner, or only a background image, exposes its fill
just as one already carrying a fill does — so every region an operator can see
outlined and click has something inside it. The current value returned is the
fill the panel holds today, and a panel that declares none reports no value
rather than a resolved or invented one. The colour that may be written is a
**reference into the site's own palette**, and the entries available come back
with the answer.

**The image field is offered only when the panel already carries a background
image.** It must hold a value, and its choices are a **closed list**, carried
with the field itself, of the handles the site's images can be referenced by —
the same list an image region's picker offers, so what a region can sit in front
of and what a panel can sit behind never disagree about what the site has. The
current value returned is the handle the panel paints today.

Nothing else of the panel's paint is offered: its corner radius, opacity,
overlay, pattern and gradient are not fields on this form. Nor is either field
offered on a region of another kind that happens to carry one — a run of copy or
an image region that also carries a background or a fill still exposes only its
own fields. And a box or container that paints **nothing** is not a region at
all: it is never offered either field, because it is never addressable.

## Verification

Address a painted panel region carrying a background image in a seeded site
whose asset store holds several images and whose definition declares a palette.
Request its fields and assert both are returned: a closed-list field marked as
requiring a value, whose options are the site's image handles (each once, in a
stable order) and whose returned current value is the handle in the draft; and a
colour field whose returned current value is the fill in the draft. Assert the
site's palette entries come back with the same answer. Address a second panel
that paints by some parameter other than a fill or an image — a rounded corner
alone — and assert it returns the colour field and no image field, with no
current value for the colour. Assert no field for any other paint parameter is
present on either. Assert a copy region and an image region in the same page
still return their own fields unchanged, including when they carry a background
or a fill of their own. Assert the same answer is returned when the region is
read through the builder origin.
