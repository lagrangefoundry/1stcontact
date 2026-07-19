---
uid: acceptance_criterion-65b5ddd3
id: AC-631
type: acceptance_criterion
title: Surface fill is compared as the effective alpha-composited colour
created_by: xgd
created_at: '2026-07-19T02:18:14.917042+00:00'
updated_at: '2026-07-19T02:25:29.328881+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
The surface colour captured and compared for an element is its effective rendered colour after compositing translucent fills over the fills painted behind them (alpha-aware, painter's "over"), not the element's declared background colour. A translucent light card over a tinted band is therefore compared as the blended tint it actually shows. Consequently: two elements that render the same effective surface colour produce no surface-fill delta even if their declared background colours differ; and an element whose effective rendered surface differs from the reference surfaces a delta.

## Verification
Capture a fixture containing a translucent white card over a tinted band and diff it. Assert the captured/compared surface colour for that card is the blended tint (not pure white), so a reproduction painting an opaque white card there produces a surface-fill delta, while a reproduction matching the blended tint produces none.