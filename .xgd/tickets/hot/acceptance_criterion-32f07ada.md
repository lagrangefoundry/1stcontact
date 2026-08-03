---
uid: acceptance_criterion-32f07ada
id: AC-762
type: acceptance_criterion
title: A box carries a typed left accent rule distinct from a full border
created_by: xgd
created_at: '2026-08-03T01:33:34.525988+00:00'
updated_at: '2026-08-03T02:03:11.779826+00:00'
completed_at: null
last_field_updated: status
status: active
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
uniform border is — never a passthrough style string — and carries the same
**typed** discipline: a finite, non-negative width, a hex-only colour, a closed
set of line styles, and no unknown keys, so no raw CSS can ride in beside the
typed fields.

The **numeric-range** layer is where the two diverge, and the criterion states
what the substrate does rather than what symmetry would suggest: the envelope's
effect-length cap (±10000px) is applied by `checkEffects`
(`packages/site-schema/src/l1/validate.ts`) to `axes.border.widthPx` only — it
never visits `axes.borderLeft`. The same oversize width is therefore rejected on
the uniform border and accepted on the accent rule. The accent rule's width is
bounded by its type (finite, non-negative), not by that cap. This is a stated
asymmetry, not a silent one: it is pinned by an executable assertion, so closing
the gap in the validator would fail this criterion's UAT rather than pass
unnoticed.

## Verification
Render a box declaring only a left accent rule and observe the emitted CSS draws
a left-edge rule of the declared width, style and colour with no rule on the
other three edges. Render a box declaring both a uniform border and a left accent
rule and observe both appear, with the left rule taking effect on that edge.
Submit a negative width, a non-finite width, a non-hex colour, a line style
outside the enum, and a freeform extra key, and observe rejection of each.
Submit an oversize (50000px) width on the accent rule and observe acceptance, and
the identical width on the uniform border and observe rejection naming
`/root/axes/border/widthPx` — pinning where the effect-length cap does and does
not apply.