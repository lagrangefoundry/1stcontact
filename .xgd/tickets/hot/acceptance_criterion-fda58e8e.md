---
uid: acceptance_criterion-fda58e8e
id: AC-1010
type: acceptance_criterion
title: The floor begins where the run stops wrapping, and a container's width is never
  relaxed
created_by: xgd
created_at: '2026-08-07T02:57:16.646519+00:00'
updated_at: '2026-08-07T03:10:39.766724+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion

The floor is **gated in two directions**.

By width: it applies only **at and above the viewport width from which the run
stopped wrapping**. Below that width — including under the un-mediated base rule,
which is in force at the smallest widths — the run keeps a hard pixel width,
because there the width still decides where its lines break and relaxing it would
let an absolutely-positioned run stretch to its shrink-to-fit width and reflow
every line. A run that wraps nowhere on the ladder is floored throughout; a run
that wraps everywhere is floored nowhere.

By node kind: a **container's width is never relaxed**, at any width. A box's
width is structure — it sizes its children and bounds its background — so it
always emits its captured width as a fixed size.

## Verification

Fold a document from a capture whose run wraps at the two smallest ladder widths
and renders on a single line from the third upward. Observe the run's width
declarations are hard pixel values below that threshold and a minimum width at
and above it, and that both sides of the threshold are actually present in the
output. Separately, render a document containing a geometry-tracked container
alongside a single-line run and observe the container emits a fixed width at
every rung while the run is floored — using an authored document rather than a
folded one if no fold fixture produces a container carrying captured geometry.