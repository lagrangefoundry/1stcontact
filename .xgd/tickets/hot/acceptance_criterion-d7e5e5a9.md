---
uid: acceptance_criterion-d7e5e5a9
id: AC-951
type: acceptance_criterion
title: Which regions are editable is derived from the definition's structure, and
  a region with nothing to edit is neither stamped nor outlined
created_by: xgd
created_at: '2026-08-06T21:26:16.830197+00:00'
updated_at: '2026-08-10T08:50:03.953800+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The edit render marks editable regions without the definition declaring any of
them — no annotation is authored, and none is required. Derived from the
definition's own structure:

- a run of text is a **copy** region;
- an image is an **image** region;
- a container that paints something (a background, a fill, a border, or any
  other surface treatment the renderer paints) is a **container** region;
- a seam with a behavior mounted in it is a **module** region.

Each of those carries both its region kind and its address. Deliberately
carrying neither, and therefore drawing no outline:

- a container that paints nothing (there is nothing about it to change);
- a seam with nothing mounted in it (an inert placeholder);
- a leaf control belonging to a mounted behavior (its element, attributes and
  behaviour are the module's).

A paint treatment added to the substrate in future is covered without revisiting
segmentation: whether a container paints is decided by whether the renderer
would paint it, not by a separately maintained list.

## Verification

Seed a page carrying several text runs, an image, one painted and one unpainted
container, a mounted behavior instance, an empty seam, and a control leaf inside
the mounted behavior. Render the edit channel and collect every stamped region
with its kind. Assert the text runs are copy, the image is an image, exactly one
container appears (the painted one), and the mounted seam appears as a module.
Assert the empty seam, the unpainted container and the control leaf carry no
region stamp and no address.