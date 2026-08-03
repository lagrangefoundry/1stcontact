---
uid: acceptance_criterion-69f5301f
id: AC-758
type: acceptance_criterion
title: A section's background image and translucent scrim fold to one box painted
  beneath the content
created_by: xgd
created_at: '2026-08-03T00:59:20.895406+00:00'
updated_at: '2026-08-03T01:27:46.088365+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A section that paints a CSS background image **or** a translucent scrim folds to one
box carrying the resolved image URL and the scrim colour-with-alpha, placed by the
captured section geometry with a per-width keyframe track, interpolate/snap segments
and a visibility rule. Each axis is read from the widest width that carries it, so a
section painting an image at some widths and only a scrim at others carries both.

These boxes paint beneath the cards and all content leaves, so a hero photo and its
veil sit behind everything the section holds, and the veil renders as a translucent
layer above the image rather than an opaque fill.

A section painting neither an image nor a scrim folds no box, and a gradient- or
solid-only band folds none either.

## Verification
Fold a capture whose hero section carries a background image and a translucent scrim;
assert one box carrying both the URL and the scrim colour with its alpha, that it
precedes the cards and content in document order, and that it carries a keyframe at
each present width. Render and assert the scrim paints as a translucent layer over the
image. Assert a scrim over a solid band still folds, and that a section with neither an
image nor a scrim, and a gradient-only band, fold no box.