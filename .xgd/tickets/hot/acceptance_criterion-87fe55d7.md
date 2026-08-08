---
uid: acceptance_criterion-87fe55d7
id: AC-804
type: acceptance_criterion
title: A behavior-module seam can be measured through the slot itself
created_by: xgd
created_at: '2026-08-06T01:16:34.279985+00:00'
updated_at: '2026-08-08T00:42:30.239754+00:00'
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
A `slot` — the seam a behavior module mounts into — carries the same per-axis
sizing primitive as every other kind (`fixed | fluid | hug`, with `px`, `minPx`
and `maxPx`), and the published page emits the corresponding `width` /
`min-width` / `max-width` on the slot's own element. A mounted module therefore
takes its measure from the seam it mounts into.

A sizing-only wrapper around a slot is consequently unnecessary: the same mounted
module authored with a measure on the slot and authored inside a wrapper
container whose only purpose was to carry that number renders at the same width
with one fewer element in the markup.

Sizing on a slot is opt-in in the same way as on every other kind: a slot
declaring none emits no width declarations, so existing pages render unchanged.

## Verification
Render a document containing a slot declaring a fluid measure with a maximum and
observe `width` / `min-width` / `max-width` on the slot's own rule; render a
fixed measure and observe its pixel width; render a slot with no sizing and
observe no width declarations. Render a mounted module both ways — measured slot
versus sizing-only wrapper container — and observe the same rendered width with
one fewer element in the measured form.