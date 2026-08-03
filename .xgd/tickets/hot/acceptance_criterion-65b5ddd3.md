---
uid: acceptance_criterion-65b5ddd3
id: AC-631
type: acceptance_criterion
title: Surface fill is compared as the effective alpha-composited colour
created_by: xgd
created_at: '2026-07-19T02:18:14.917042+00:00'
updated_at: '2026-08-03T02:27:04.236283+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The surface colour captured and compared for an element is its effective rendered colour after compositing translucent fills over the fills painted behind them (alpha-aware, painter's "over"), not the element's declared background colour. Two refinements to *which* fills are composited and *how precisely* they are read:

- **Resolved geometrically, not by DOM ancestry.** The fills composited are those painted by the boxes that geometrically **contain** the element, tightest first (DOM ancestors unioned in, since containment is not guaranteed under negative margins or overflow). On a conventionally-nested page this is the same answer the ancestor relationship gives, so a nested reference is unchanged; on a flat, absolutely-positioned reproduction whose card is a *sibling* of the run, the card is the surface rather than the page backstop behind it.
- **Alpha is read losslessly.** A colour carrying its own alpha is read from the browser's own colour serialization rather than from a rendered pixel, so a modern-syntax translucent fill (`color-mix` / `oklab` / `oklch` / `color()`) composites at its authored value instead of a premultiplied round-trip approximation.

Consequently: a translucent light card over a tinted band is compared as the blended tint it actually shows; two elements that render the same effective surface colour produce no surface-fill delta even if their declared background colours differ; an element whose effective rendered surface differs from the reference surfaces a delta; and a reproduction that paints the correct fill on a sibling box produces **no** phantom surface-fill delta (previously the whole page reported the body backstop, some deltas reported reversed).

## Verification
1. Capture a fixture containing a translucent white card over a tinted band and diff it. Assert the compared surface colour for that card is the blended tint (not pure white), so a reproduction painting an opaque white card there produces a surface-fill delta while one matching the blended tint produces none.
2. Diff a fixture whose reproduction paints the band and card as absolutely-positioned **siblings** of the run: assert the run's surface fill is the card's, not the body backstop's, and no surface-fill delta is reported. Assert a conventionally-nested fixture resolves to the same value it did before, and that a tighter enclosing surface wins over the band behind it.
3. Capture a translucent scrim authored in a modern colour syntax and assert the composited value matches the authored colour rather than a pixel-probe approximation.
