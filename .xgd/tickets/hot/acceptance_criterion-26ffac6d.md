---
uid: acceptance_criterion-26ffac6d
id: AC-1028
type: acceptance_criterion
title: Clicking an image region opens a form offering a picker of the site's images,
  with its current handle always among them
created_by: xgd
created_at: '2026-08-07T17:03:16.847492+00:00'
updated_at: '2026-08-16T04:19:09.788172+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The gesture is kind-agnostic: a click that resolves to an **image** region opens
the same single form dialog a copy region does, built from whatever that region
exposes. For an image that is *which image goes here* — a closed picker whose
options are the site's own image assets, presented as a grid of thumbnails —
together with its alt text, both pre-filled with the values currently in the
draft.

The picker is closed and honest about the site it belongs to:

- it offers the site's images, and only images — an asset no image field could
  point at (a font, a stylesheet) is not among the options;
- it offers images the page does not currently use, including ones the asset
  registry never declared, because offering only what is already on the page is
  not a picker;
- the handle **already in place** is always among the options, even when it is
  one the site's asset store does not hold, and it is the option **selected when
  the dialog opens**: exactly one choice is marked, and it is that handle. Being
  merely present is not enough — a picker that opened on the first option, or on
  none, would let a region that was opened to edit only its alt text silently
  swap its image on Save.

Nothing about the gesture changes for this region kind — no second modal, no
image-specific route, no separate transport. Framing (crop, scale, scrim,
rotation, position), upload and image processing are not offered.

## Verification

Over an editable rendering, resolve a click landing on an image region and
assert it resolves to that region as an image. Assert the form the gesture opens
for it carries a required closed-option field for the image and a text field for
the alt text, pre-filled from the draft; that the option list is exactly the
site's images (excluding a font and a stylesheet present in the same asset
directory) and includes images the page does not use and one the registry never
declared; and that a region whose current handle is not in the site's asset store
still has that handle among its own options. Assert exactly one option is marked
as chosen when the dialog opens and that it is the handle the region currently
holds. Assert the modal obtains these choices over the same copy transport a copy
edit uses, not an image-specific one.