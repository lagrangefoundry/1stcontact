---
uid: acceptance_criterion-df2932d3
id: AC-2532
type: acceptance_criterion
title: A per-width background override keeps the whole layer stack and never drops
  the image layer
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:33:06.717099+00:00'
updated_at: '2026-11-09T06:33:06.717099+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A per-width background override restates the node's **whole** background layer
stack in the same order as the base rule: scrim, then texture, then gradient,
then image. Only the image layer's URL is swapped for the chosen rendition, so a
scrim, texture or gradient painted over a laddered background is present at
every breakpoint. The override restates only `background-image`. The base rule
still carries the size, position and repeat lists, and they stay positionally
aligned.

If a chosen rendition's URL would be rejected by the stylesheet `url()`
sanitisation, the authored background URL is used in its place. A rejected
rendition never removes the image layer.

## Verification
Render a band with a scrim, a gradient and a laddered background image. For
every emitted per-width override, assert that the `background-image` value
contains the scrim and gradient layers in the base rule's order, with only the
image URL differing. Supply a manifest whose chosen rendition carries an unsafe
URL and assert that the override (or base) paints the authored URL rather than
dropping the image layer.
