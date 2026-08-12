---
uid: acceptance_criterion-db84cd2e
id: AC-1125
type: acceptance_criterion
title: A node's own paint carries a typed colour adjustment, emitted as one declaration
  in a fixed order
created_by: xgd
created_at: '2026-08-12T21:12:29.550273+00:00'
updated_at: '2026-08-12T21:12:29.550273+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
Every box-rendering kind may declare a **typed colour adjustment of its own
paint** on the shared surface group: greyscale, sepia, invert, saturation,
brightness, contrast, hue shift and a blur of the node's own pixels. Each is a
bounded number — a ratio or an angle — and there is no freeform filter string.

The values are held as **CSS-canonical ratios rather than percentages**, which is
the form a browser reports when it is asked what a page is painting. A surface
adjusted to four-tenths saturation holds four-tenths, not forty. This is what
lets a measurement taken off a real page be recorded unconverted, and what lets
the round trip close without a hidden unit change. Any percentage control offered
over these values elsewhere is a projection over them, not the axis itself.

The published page shows the whole set as **exactly one declaration**, whichever
combination is declared, and the **order of the functions inside it is the
renderer's, not the document's**. That is load-bearing rather than tidiness:
adjustment functions compose in sequence, so removing colour then doubling
saturation paints differently from doubling saturation then removing colour. The
order a document happens to list its fields in is an accident of how the file was
written or how a diff was applied, and letting it decide the pixels would let two
definitions that say the identical thing render two different ways. The same set
of adjustments therefore always paints the same result.

The adjustment is **distinct from the backdrop blur** the same group carries and
is emitted as its own property: one blurs what sits behind the node, the other
adjusts what the node itself paints, and a node may declare both.

## Verification
Render a node declaring several adjustments at once and assert the emitted CSS
carries a single filter declaration containing all of them. Render two documents
that declare the identical adjustments with their fields written in different
orders and assert the emitted declaration is byte-identical. Assert the declared
ratios appear as ratios in the output rather than as percentages. Declare the
adjustment on each box-rendering kind in turn and observe it emitted for every
kind, and declare it alongside a backdrop blur and assert both are emitted as
separate properties.
