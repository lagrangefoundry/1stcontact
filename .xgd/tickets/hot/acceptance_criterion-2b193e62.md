---
uid: acceptance_criterion-2b193e62
id: AC-832
type: acceptance_criterion
title: The envelope bounds the texture's period, width and colour through the shared
  surface check
created_by: xgd
created_at: '2026-08-06T02:21:38.575396+00:00'
updated_at: '2026-08-08T00:43:17.605670+00:00'
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
The texture axis is bounded by the **same shared surface check** as every other
paint axis, so it cannot escape the envelope by being declared somewhere nobody
remembered to check.

Rejected, with the offending field located in the returned error list:
- a **tile period** outside `[1, 1000]` px. The *floor* is a robustness rule, not
  taste — a sub-pixel period tiles a full-bleed band millions of times and is a way
  to hang a compositor;
- a **line width** outside `[0, 1000]` px, and a tilt outside the effect-length
  bounds;
- a shape outside the closed set (`noise` is not a texture), a colour that is not a
  hex literal (`rgba(...)` is refused), a texture missing its period, and any
  unknown/extra key on the texture object — so no freeform CSS can be smuggled in
  beside a typed field.

Because the check is shared, an **interaction-state texture delta is bounded by the
identical rule as the base node**: a hover state carrying an out-of-range period is
rejected exactly as the node's own would be.

Where a value is in range but geometrically degenerate the renderer saturates
rather than misdraws: a rule wider than its own period is a fill, not a texture, so
its width clamps at the period instead of bleeding into the neighbouring tile.

## Verification
Submit documents each violating one rule — a sub-pixel period, an oversize period,
an oversize line width, an unknown shape, a non-hex colour, an extra key, a missing
period — and observe a "not ok" result naming the offending path (including the
`.../pattern/spacingPx` and `.../pattern/thicknessPx` paths). Repeat the range
violation inside an interaction-state delta and observe identical rejection. Render
a texture whose width equals or exceeds its period and observe the emitted layer
clamped at the period.