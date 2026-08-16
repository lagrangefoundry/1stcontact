---
uid: acceptance_criterion-8a3c8c3e
id: AC-1045
type: acceptance_criterion
title: Asking a painted panel what it exposes returns one closed picker of the site's
  images for the background it carries, and nothing else of its paint
created_by: xgd
created_at: '2026-08-10T08:23:08.470214+00:00'
updated_at: '2026-08-16T06:55:45.659043+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Requesting the editable fields of a region that is a **painted panel already
carrying a background image** succeeds — through the *same* "what does this
region expose" operation that answers for a run of copy and for an image region,
not a separate one — and returns exactly **one** field: **which image sits
behind it**.

That field must hold a value, and its choices are a **closed list**, carried
with the field itself, of the handles the site's images can be referenced by —
the same list an image region's picker offers, so what a region can sit in front
of and what a panel can sit behind never disagree about what the site has. The
current value returned is the handle the panel paints today.

Nothing else of the panel's paint is offered: its fill, corner radius, opacity,
overlay, pattern and gradient are not fields on this form. Nor is the handle
offered on a region of another kind that happens to carry one — a run of copy or
an image region that also carries a background still exposes only its own
fields.

## Verification

Address a painted panel region carrying a background image in a seeded site
whose asset store holds several images. Request its fields and assert exactly
one is returned; that it is a closed-list field marked as requiring a value,
whose options are the site's image handles (each once, in a stable order); and
that the returned current value is the handle in the draft. Assert no field for
any other paint parameter is present. Assert a copy region and an image region
in the same page still return their own fields unchanged, including when they
carry a background of their own. Assert the same answer is returned when the
region is read through the builder origin.