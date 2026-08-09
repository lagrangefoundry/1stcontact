---
uid: acceptance_criterion-00d8a404
id: AC-803
type: acceptance_criterion
title: A text run declares its own measure and the layout gate wraps against it
created_by: xgd
created_at: '2026-08-06T01:16:20.419101+00:00'
updated_at: '2026-08-09T05:40:42.864857+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A text run carries its **own measure**: the same per-axis sizing primitive every
other kind carries (`fixed | fluid | hug`, with `px`, `minPx` and `maxPx`). The
published page emits the corresponding `width` / `min-width` / `max-width` on the
run's own element — a fluid run with a maximum emits a full-width rule capped at
that maximum, a fixed run emits its pixel width — so a paragraph caps its line
length on itself.

Sizing on a run is strictly opt-in: a run declaring none emits **no** width
declarations at all, so every existing document (in particular every
capture-folded reproduction, which pins runs by geometry and never populates
sizing) renders unchanged.

A constrained paragraph therefore needs **no wrapper container**: the same
subhead authored with a measure on the run and authored inside a sizing-only
wrapper produce the same painted width and the same wrapped height, with one
fewer element in the markup.

The reproduction's **analytic layout gate models the same constraint**, for every
node kind: the frame a node is offered is narrowed by that node's own declared
width (a fixed width, then its min/max clamps) before its content is laid out.
Because a run's height is a function of its width, a measured run is predicted to
wrap to the taller box the browser actually produces rather than to the frame's
width — so a measure does not read as drift, a wrapper's maximum width and a
run's own measure evaluate identically, and a cap that is wider than the frame is
inert.

## Verification
Render a run declaring a fluid measure and observe `width` / `min-width` /
`max-width` on the run's own rule; render a fixed measure and observe its pixel
width; render a run with no sizing and observe no width declarations. Render the
same paragraph as (a) a measured run and (b) a run inside a sizing-only wrapper
and observe identical painted width and wrapped height with one fewer element in
(a). Run the analytic layout gate over both forms at a wide and a narrow viewport
and observe identical leaf width and height, the measured run reporting a greater
height than the unmeasured one at the wide width, and the cap inert at the narrow
one. Confirm a pinned, geometry-tracked run (the folded-reproduction shape) is
unaffected in both the emitted CSS and the gate.