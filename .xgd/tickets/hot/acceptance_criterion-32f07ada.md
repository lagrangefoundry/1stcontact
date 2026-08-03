---
uid: acceptance_criterion-32f07ada
id: AC-762
type: acceptance_criterion
title: A box carries a typed left accent rule distinct from a full border
created_by: xgd
created_at: '2026-08-03T01:33:34.525988+00:00'
updated_at: '2026-08-03T01:33:34.525988+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A box may declare a **left accent rule** — a typed width, hex colour and line
style applied to its left edge only — as an axis distinct from the uniform border
that frames all four sides. A card whose design is a thick coloured rule down its
left edge reproduces as that rule, not as a full outline around the card, and a
box may carry both (the explicit left rule taking effect over the uniform
border's left side).

The rule is re-derived from its numeric, enum and hex fields exactly as the
uniform border is — never a passthrough style string — and takes the same
envelope bounds: hex-only colour, a bounded width, a closed set of line styles,
and no unknown keys.

## Verification
Render a box declaring only a left accent rule and observe the emitted CSS draws
a left-edge rule of the declared width, style and colour with no rule on the
other three edges. Render a box declaring both a uniform border and a left accent
rule and observe both appear, with the left rule taking effect on that edge.
Submit an out-of-range width and a non-hex colour and observe rejection.
