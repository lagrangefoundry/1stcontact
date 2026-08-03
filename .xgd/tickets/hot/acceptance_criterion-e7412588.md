---
uid: acceptance_criterion-e7412588
id: AC-759
type: acceptance_criterion
title: Per-side padding insets content inside the pinned box
created_by: xgd
created_at: '2026-08-03T01:32:59.149272+00:00'
updated_at: '2026-08-03T02:03:12.893646+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A node of any kind may declare **per-side padding** — four optional, non-negative
lengths — and the published page insets that node's content by exactly those
amounts **without changing the box the layout pinned**. Because the document's
own reset makes every element size by its border box, padding eats into the
pinned geometry from the inside: a pill badge's glyphs sit off its edge and a
control gains its click-target height, while the element's outer rect stays the
rect the document declared, so a padded document round-trips to the same geometry
it was authored with.

Only the declared sides are emitted, as individual per-side declarations, so a
node declaring padding on one side leaves the other three untouched rather than
resetting them to zero. A negative side, a side above the 10000px cap, and a
padding object carrying any key other than the four sides are all rejected by the
envelope before the document can reach the renderer.

## Verification
Render a node whose keyframe box is a known rect and which declares padding on
all four sides; observe the emitted CSS carries the per-side padding declarations
alongside the unchanged pinned width/height and the border-box reset, and that a
real-engine capture reports the same outer rect as the same node with no padding
while its content is inset. Render a node declaring only one side and observe no
declaration for the other three. Submit a negative side, an over-cap side, and a
padding object with a freeform key, and observe each is rejected.